import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';
import { ToastService } from '../services/toast.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

const addTokenHeader = (req: HttpRequest<unknown>, token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const injector = inject(Injector);
  const toast = inject(ToastService);

  // Skip public auth endpoints
  const isPublicAuthRoute =
    req.url.includes('/Auth/login') ||
    req.url.includes('/Auth/register') ||
    req.url.includes('/Auth/refresh-token') ||
    req.url.includes('/password/forgot') ||
    req.url.includes('/password/reset');

  if (isPublicAuthRoute) {
    return next(req);
  }

  const token = isPlatformBrowser(platformId) ? localStorage.getItem('accessToken') : null;

  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. Session Expiration / 401 Unauthorized
      if (error.status === 401) {
        const authService = injector.get(AuthService);

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((newTokens) => {
              isRefreshing = false;
              refreshTokenSubject.next(newTokens.accessToken);
              return next(addTokenHeader(req, newTokens.accessToken));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.clearSession();
              toast.warning('Your session has expired. Please sign in again.', 'Session Expired');
              router.navigate(['/login'], {
                queryParams: { returnUrl: router.routerState.snapshot.url }
              });
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((newToken) => newToken !== null),
            take(1),
            switchMap((newToken) => next(addTokenHeader(req, newToken!)))
          );
        }
      }

      // 2. Forbidden / Insufficient Permissions (403)
      if (error.status === 403) {
        toast.warning('You do not have permission to perform this action.', 'Access Denied');
      }

      // 3. Network Outage / Microservice Down (0)
      else if (error.status === 0) {
        toast.error('Unable to connect to the server. Check if backend APIs or Redis are running.', 'Network Error');
      }

      // 4. Server Crashes / Internal Failures (500, 502, 503, 504)
      else if (error.status >= 500) {
        const detailMsg =
          typeof error.error === 'object' && error.error !== null && 'message' in error.error
            ? String(error.error.message)
            : 'A backend service encountered an error. Please try again later.';
        toast.error(detailMsg, `Server Error (${error.status})`);
      }

      return throwError(() => error);
    })
  );
};