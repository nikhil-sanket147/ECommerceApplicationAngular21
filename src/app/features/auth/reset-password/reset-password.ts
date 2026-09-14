import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  token = signal('');
  userEmail = signal('');
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParams['token'] || '';
    const emailParam = this.route.snapshot.queryParams['email'] || '';
    this.token.set(tokenParam);
    this.userEmail.set(emailParam);

    if (!tokenParam) {
      this.errorMessage.set('Invalid or expired password reset token.');
    }
  }

  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  onSubmit(): void {
    if (this.form.invalid || !this.token()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      email: this.userEmail(),
      token: this.token(),
      newPassword: this.form.value.newPassword!,
      confirmPassword: this.form.value.confirmPassword!
    };

    // this.authService.resetPassword(payload).subscribe({
    //   next: () => {
    //     this.isLoading.set(false);
    //     this.router.navigate(['/login'], { queryParams: { resetSuccess: 'true' } });
    //   },
    //   error: (err: HttpErrorResponse) => {
    //     this.isLoading.set(false);
    //     this.errorMessage.set(err.error?.message || 'Password reset failed.');
    //   }
    // });
  }
}