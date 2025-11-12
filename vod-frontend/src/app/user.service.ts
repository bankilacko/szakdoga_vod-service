import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AnalyticsService } from './analytics.service';
import { Observable, tap, of, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // API URL
  //private apiUrl = 'http://152.66.245.139:22291/user-service'; // User-service URL (VM with port forwarding)
  private apiUrl = 'http://localhost:5000/user-service'; // User-service URL (test - frontend runs on kubernetes)
  //private apiUrl = 'http://api-gateway/user-service';
  //private apiUrl = 'http://api-gateway/user-service'; // User-service URL (test - frontend runs on host)

  // EVENTS
  private logoutSubject = new Subject<void>(); // Logout event

  // STRINGS
  private jwtToken: string | null = null; // JWT token for authentication

  // BOOLEANS
  private isDarkTheme = false;

  // CONSTRUCTOR
  constructor(
    private http: HttpClient,
    private analyticsService: AnalyticsService,
  ) { 
    // Load theme preference from localStorage on service initialization
    this.loadThemePreference();
  }

  // BACKEND USER-SERVICE API CALLS

  // Registration
  // Calling backend user-service /register api endpoint
  register(user: { username: string; email: string; password: string }): Observable<any> {
    const hashedUser = {
      ...user,
      password: this.hashPassword(user.password), // Hash password
    };
    return this.http.post(`${this.apiUrl}/register`, hashedUser, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Login
  // Calling backend user-service /login api endpoint
  login(credentials: { username: string; password: string }): Observable<any> {
    const hashedCredentials = {
      ...credentials,
      password: this.hashPassword(credentials.password), // Hash password
    };
    return this.http.post(`${this.apiUrl}/login`, hashedCredentials).pipe(
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

  // Edit profile
  // Calling backend user-service /edit_profile api endpoint
  edit(user: { username: string; email: string; password: string }): Observable<any> {
    const token = this.getToken(); // Get JWT token

    const hashedUser = {
      ...user,
      // Only hash the password if it is not empty
      password: user.password ? this.hashPassword(user.password) : user.password,
    };
    return this.http.post(`${this.apiUrl}/edit_profile`, hashedUser, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // Attach the token to the request
      },
    });
  }


  // FUNCTIONS

  // Hash password
  // Function to hash password before sending it to the backend
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString(); // SHA-256 használata
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

  // Get user ID for current user
  getUserID(): number | null {
    // Check the token's existense
    if (!this.jwtToken) {
      this.jwtToken = sessionStorage.getItem('jwtToken'); // get token from sessionStorage
    }
    
    if (!this.jwtToken) {
      return null;
    }
    
    try {
      // Decode JWT token (no verification needed on frontend)
      const payload = JSON.parse(atob(this.jwtToken.split('.')[1]));
      return payload.user_id || null;
    } catch (e) {
      console.error('Error decoding JWT token:', e);
      return null;
    }
  }

  getTheme(): boolean{
    return this.isDarkTheme;
  }

  switchTheme(): void{
    this.isDarkTheme = !this.isDarkTheme;
    // Save theme preference to localStorage
    localStorage.setItem('darkTheme', this.isDarkTheme.toString());
    // Apply theme to body
    this.applyThemeToBody();
  }

  private loadThemePreference(): void {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme !== null) {
      this.isDarkTheme = savedTheme === 'true';
    }
    // Apply theme to body
    this.applyThemeToBody();
  }

  private applyThemeToBody(): void {
    const body = document.body;
    if (this.isDarkTheme) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
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
