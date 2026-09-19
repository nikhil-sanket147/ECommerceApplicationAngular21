import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';

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

  // Skip public auth endpoints with controller prefixes
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
              router.navigate(['/login']);
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

      return throwError(() => error);
    })
  );
};