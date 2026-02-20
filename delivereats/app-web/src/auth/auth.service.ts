import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from './interfaces/auth.interface';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://api-gateway:3000/auth';

  currentUser = signal<any>(null);

  userRole = computed(() => this.currentUser()?.role || '');

  constructor() {
    this.checkToken();
  }

  checkToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        this.currentUser.set(decoded);
      } catch {
        this.logout();
      }
    }
  }

  // --- LOGIN ---
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.token) {
            // Guardamos el token en el navegador
            localStorage.setItem('token', response.token);
          }
        }),
      );
  }

  // --- REGISTRO ---
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  // --- LOGOUT ---
  logout() {
    this.currentUser.set('');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // --- UTILS ---
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token'); // Devuelve true si existe token
  }

  getUserData() {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode<any>(token); // Retorna { userId, email, role, firstName, lastName }
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
