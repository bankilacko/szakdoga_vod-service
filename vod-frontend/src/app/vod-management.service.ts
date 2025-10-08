import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from './user.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VodManagementService {
  // API URL
  private apiUrl = 'http://172.16.0.29:30080/vod-management-service'; // Vod-management-service URL (VM K8s NodePort)
  //private apiUrl = 'http://localhost:5000/vod-management-service'; // Local development

  // CONSTRUCTOR
  constructor(private http: HttpClient, private userService: UserService) {}

  // BACKEND VOD_MANAGEMENT-SERVICE API CALLS
  // Load the available videos information, using the JWT token
  getVideos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/videos`); // return videos
  }
}

