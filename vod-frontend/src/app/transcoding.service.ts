import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranscodingService {
  // API URL
  private apiUrl = 'http://152.66.245.139:22291/transcoding-service'; // Transcoding-service URL (VM with port forwarding)
  //private apiUrl = 'http://localhost:5000/transcoding-service'; // Local development

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
