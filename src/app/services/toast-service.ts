import { Injectable, signal } from '@angular/core';
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export interface ToastItem {
  id: number,
  message: string,
  type: ToastType
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private counter = 0;
  toasts = signal<ToastItem[]>([]);

  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    const id=++this.counter;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration: number = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 4000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 3000) {
    this.show(message, 'warning', duration);
  }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
