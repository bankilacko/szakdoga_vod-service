import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranscodingService {
  // API URL
  //private apiUrl = 'http://localhost:30087/transcoding-service'; // Transcoding-service URL (test - frontend runs on kubernetes)
  private apiUrl = 'http://localhost:5000'; // Transcoding-service URL (test - frontend runs on host)

  // CONSTRUCTOR
  constructor(private http: HttpClient) { }

  // Upload
  // Calling backend transcoding-service /upload api endpoint
  upload(fileData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, fileData, {
      headers: {
        // Content-Type: multipart/form-data is automatically set by the browser for FormData
      },
    });
  }
}
