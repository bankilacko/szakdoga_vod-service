import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from './user.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VodManagementService {
  // API URL from environment - dynamically constructed with service name
  private apiUrl = `${environment.apiBaseUrl}/vod-management-service`;

  // CONSTRUCTOR
  constructor(private http: HttpClient, private userService: UserService) {}

  // BACKEND VOD_MANAGEMENT-SERVICE API CALLS
  // Load the available videos information, using the JWT token
  getVideos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/videos`); // return videos
  }

  // Get comment count for a specific video
  getVideoCommentCount(videoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/videos/${videoId}/comments/count`);
  }
}

