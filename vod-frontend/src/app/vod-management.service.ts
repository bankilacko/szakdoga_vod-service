import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from './user.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VodManagementService {
  // API URL
  //private apiUrl = 'http://152.66.245.139:22291/vod-management-service'; // VM with port forwarding
  private apiUrl = 'http://localhost:5000/vod-management-service'; // Vod-management-service URL (test - frontend runs on kubernetes)
  //private apiUrl = 'http://api-gateway/vod-management-service';
  //private apiUrl = 'http://vod-management-service.default.svc.cluster.local';
  //private apiUrl = 'http://localhost:5000'; // Vod-management-service URL (test - frontend runs on host)

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

