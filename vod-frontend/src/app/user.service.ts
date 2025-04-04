import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, of, Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // API URL
  //private apiUrl = 'http://localhost:30087/user-service'; // User-service URL (test - frontend runs on kubernetes)
  private apiUrl = 'http://localhost:5000'; // User-service URL (test - frontend runs on host)

  // EVENTS
  private logoutSubject = new Subject<void>(); // Logout event

  // STRINGS
  private jwtToken: string | null = null; // JWT token for authentication

  // CONSTRUCTOR
  constructor(private http: HttpClient) { }

  // BACKEND USER-SERVICE API CALLS
  // Registration
  // Calling backend user-service /register api endpoint
  register(user: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user, {
      headers: { 'Content-Type': 'application/json' } // Content-Type header, send registration information
    });
  }

  // Login
  // Calling backend user-service /login api endpoint
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Get JWT token from response
        this.jwtToken = response.access_token;
        // Store token in sessionStorage
        if (this.jwtToken) {
          sessionStorage.setItem('jwtToken', this.jwtToken);
        }
      })
    );
  }

  // Get profile informations
  // Calling backend user-service /get_current_user api endpoint
  getProfile(){
    const token = this.getToken(); // Get JWT token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}` // Add token to request
    });
    return this.http.get(`${this.apiUrl}/get_current_user`, { headers });
  }

  // Check authentication
  // Check wether the user is logged in
  isAuthenticated(): boolean {
    this.jwtToken = this.getToken();
    return !!this.jwtToken; // If the token exists then the user is logged in
  }

  // Get token
  getToken(): string | null {
    // Check the token's existense
    if (!this.jwtToken) {
      this.jwtToken = sessionStorage.getItem('jwtToken'); // get token from sessionStorage
    }
    return this.jwtToken; // return the token
  }

  // Logout logic
  logout(): void {
    sessionStorage.removeItem('jwtToken'); // Delete token
    this.jwtToken = null;
    this.logoutSubject.next(); // Event notification
  }

  // Return observable logout event
  // The components call this function to trigger the logout event
  onLogout(): Observable<void> {
    return this.logoutSubject.asObservable();
  }
}
