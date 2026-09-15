export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  role: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  token: string;
  email: string;
  fullName?: string;
}