import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Post, CreatePostRequest, GenerateCaptionRequest } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/posts`;

  getAll() { return this.http.get<Post[]>(this.api); }
  getByAccount(accountId: number) { return this.http.get<Post[]>(`${this.api}/account/${accountId}`); }
  create(req: CreatePostRequest) { return this.http.post<Post>(this.api, req); }
  update(id: number, req: Partial<CreatePostRequest>) { return this.http.put<Post>(`${this.api}/${id}`, req); }
  delete(id: number) { return this.http.delete(`${this.api}/${id}`); }
  publishNow(id: number) { return this.http.post<Post>(`${this.api}/${id}/publish`, {}); }
  generateCaption(req: GenerateCaptionRequest) { return this.http.post<string>(`${environment.apiUrl}/ai/caption`, req, { responseType: 'text' as 'json' }); }
}
