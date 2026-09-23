import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastMessage, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  toasts = signal<ToastMessage[]>([]);

  show(type: ToastType, message: string, title?: string, duration: number = 3500): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };

    this.toasts.update((current) => [...current, newToast]);

    // Ensure timer only runs on the client/browser and triggers change detection
    if (isPlatformBrowser(this.platformId) && duration > 0) {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.dismiss(id);
        });
      }, duration);
    }
  }

  success(message: string, title: string = 'Success'): void {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Error'): void {
    this.show('error', message, title, 5000);
  }

  warning(message: string, title: string = 'Warning'): void {
    this.show('warning', message, title, 4000);
  }

  info(message: string, title: string = 'Info'): void {
    this.show('info', message, title);
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}