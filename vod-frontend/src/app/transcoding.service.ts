import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranscodingService {
  // API URL
  private apiUrl = 'http://localhost:31968/transcoding-service'; // Transcoding-service URL (test - frontend runs on kubernetes)
  //private apiUrl = 'http://localhost:5000'; // Transcoding-service URL (test - frontend runs on host)

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
