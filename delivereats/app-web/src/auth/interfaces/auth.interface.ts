export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  status: number;
  error: string[] | null;
  token?: string;
  userId?: number;
  role?: string;
}
