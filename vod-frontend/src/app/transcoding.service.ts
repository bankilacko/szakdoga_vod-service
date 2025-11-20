import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TranscodingService {
  // API URL from environment - dynamically constructed with service name
  private apiUrl = `${environment.apiBaseUrl}/transcoding-service`;

  // CONSTRUCTOR
  constructor(private http: HttpClient) { }

  // Upload
  // Calling backend transcoding-service /upload api endpoint
  upload(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData, {
      headers: {
        // Content-Type header is automatically set by the browser for FormData
      },
    });
  }
}
