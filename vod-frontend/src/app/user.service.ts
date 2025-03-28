import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, of, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root', // Globálisan elérhető szerviz
})
export class UserService {
  //private apiUrl = 'http://localhost:30087/user-service'; // API URL
  private apiUrl = 'http://localhost:5000';

  private jwtToken: string | null = null; // JWT token tárolása

  private logoutSubject = new Subject<void>(); // Kijelentkezés esemény létrehozása

  constructor(private http: HttpClient) { }

  // Regisztráció
  register(user: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user, {
      headers: { 'Content-Type': 'application/json' } // Biztosítsd a megfelelő Content-Type header-t
    });
  }

  // Bejelentkezés
  login(credentials: { username: string; password: string }): Observable<any> {
    // return this.http.post(`${this.apiUrl}/login`, credentials, {
    //   headers: { 'Content-Type': 'application/json' } // Biztosítsd a megfelelő Content-Type header-t
    // });
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Token kinyerése a válaszból
        this.jwtToken = response.access_token;
        // (Opcionális) Token tárolása localStorage-ban
        if (this.jwtToken) {
          sessionStorage.setItem('jwtToken', this.jwtToken);
        }
      })
    );
  }

  // Token lekérdezése
  getToken(): string | null {
    if (!this.jwtToken) {
      this.jwtToken = sessionStorage.getItem('jwtToken');
    }
    return this.jwtToken;
  }

  getProfile(){
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}` // Token hozzáadása a kéréshez
    });
    return this.http.get(`${this.apiUrl}/get_current_user`, { headers });
  }

  // Ellenőrizd, hogy a felhasználó be van-e jelentkezve
  isAuthenticated(): boolean {
    this.jwtToken = this.getToken();
    return !!this.jwtToken; // Ha van token, akkor be van jelentkezve
  }

  // Kijelentkezési logika
  logout(): void {
    console.log('Logout USERSERVICE');
    sessionStorage.removeItem('jwtToken'); // Token törlése
    this.jwtToken = null;
    console.log(this.getToken());
    this.logoutSubject.next(); // Esemény értesítés
  }

  // Megfigyelhető logout esemény
  onLogout(): Observable<void> {
    return this.logoutSubject.asObservable(); // Observable visszaadása a feliratkozáshoz
  }
}
