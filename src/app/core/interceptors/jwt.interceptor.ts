import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
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
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip attaching authorization header for public auth routes
  if (req.url.includes('/Auth/login') || req.url.includes('/Auth/register') || req.url.includes('/Auth/refresh-token')) {
    return next(req);
  }

  const token = authService.getAccessToken();
  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Catch token expiration / unauthorized response
      if (error.status === 401) {
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
          // If another request already initiated refresh, wait for the new token
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