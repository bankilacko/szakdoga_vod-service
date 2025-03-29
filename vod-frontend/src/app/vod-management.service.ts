import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root' // Globálisan elérhető szerviz
})
export class VodManagementService {
  //private apiUrl = 'http://localhost:30087/vod-management-service'; // Állítsd be az API URL-t
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient, private userService: UserService) {}

  // Videók lekérése JWT tokennel
  getVideos(): Observable<any> {
    console.log("getvideos");
    return this.http.get(`${this.apiUrl}/videos`);
    const token = this.userService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}` // Token hozzáadása a kéréshez
    });
    return this.http.get(`${this.apiUrl}/videos`); //, { headers }
  }

  // // Új videó létrehozása
  // createVideo(video: any): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/videos`, video);
  // }
}

