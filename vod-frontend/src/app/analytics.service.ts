import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // API URL from environment - dynamically constructed with service name
  private apiUrl = `${environment.apiBaseUrl}/analytics-service`;

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

  getRecommendations(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/recommendations/${username}`);
  }

  getVideoViewCount(videoTitle: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/video-view-count/${encodeURIComponent(videoTitle)}`);
  }

  getMostWatchedVideos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/most-watched`);
  }
}
