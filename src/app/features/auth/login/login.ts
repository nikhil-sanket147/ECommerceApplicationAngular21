import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get email(): FormControl<string> {
    return this.loginForm.controls.email;
  }

  get password(): FormControl<string> {
    return this.loginForm.controls.password;
  }

onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);

        // Check if there was an intended URL preserved by authGuard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        // Default role-based redirection
        const role = this.authService.currentUser()?.role?.toLowerCase();
        if (role === 'admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const message =
          typeof err.error === 'object' && err.error !== null && 'message' in err.error
            ? String(err.error.message)
            : 'Invalid email or password.';
        this.errorMessage.set(message);
      }
    });
  }
}