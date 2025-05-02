import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // API URL
  private apiUrl = 'http://localhost:5000/analytics-service'; // User-service URL (test - frontend runs on kubernetes)
  //private apiUrl = 'http://api-gateway/analytics-service';
  //private apiUrl = 'http://localhost:5000'; // User-service URL (test - frontend runs on host)

  constructor(private http: HttpClient) {}

  // Function to send user activity to the analytics service
  trackEvent(userName: string, eventType: string, metadata: object = {}): void {
    const payload = { username: userName, event_type: eventType, activity_metadata: metadata };
    this.http.post(`${this.apiUrl}/track`, payload).subscribe({
      next: (response) => {
        console.log('User activity tracked successfully:', response);
      },
      error: (err) => {
        console.error('Error tracking user activity:', err);
      }
    });
  }

  getRecentVideos(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/recent-videos/${username}`);
  }
}
