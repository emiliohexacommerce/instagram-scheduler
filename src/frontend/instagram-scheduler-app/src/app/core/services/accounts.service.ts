import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InstagramAccount } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/accounts`;

  getAll() { return this.http.get<InstagramAccount[]>(this.api); }
  connect() { this.http.get<{ url: string }>(`${this.api}/connect`).subscribe(r => window.location.href = r.url); }
  connectWithToken(accessToken: string) { return this.http.post(`${this.api}/connect-token`, { accessToken }); }
  disconnect(id: number) { return this.http.delete(`${this.api}/${id}`); }
}
