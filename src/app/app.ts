import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartDrawer } from './features/cart/cart-drawer/cart-drawer';
import { ToastContainer } from './shared/components/toast-container/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CartDrawer, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
}