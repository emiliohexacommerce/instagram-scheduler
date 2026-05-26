import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private _user = new BehaviorSubject<AuthResponse | null>(this.loadUser());
  user$ = this._user.asObservable();

  get isLoggedIn() { return !!this._user.value; }
  get token() { return this._user.value?.token; }

  login(req: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => { localStorage.setItem('auth', JSON.stringify(res)); this._user.next(res); })
    );
  }

  register(req: RegisterRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, req).pipe(
      tap(res => { localStorage.setItem('auth', JSON.stringify(res)); this._user.next(res); })
    );
  }

  logout() {
    localStorage.removeItem('auth');
    this._user.next(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): AuthResponse | null {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  }
}
