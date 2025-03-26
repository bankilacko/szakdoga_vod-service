import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root', // Globálisan elérhető szerviz
})
export class UserService {
  private apiUrl = 'http://localhost:30087/user-service'; // API URL

  private jwtToken: string | null = null; // Token tárolása

  constructor(private http: HttpClient) {}

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
    console.log('Login1');
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Token kinyerése a válaszból
        this.jwtToken = response.access_token;
        // (Opcionális) Token tárolása localStorage-ban
        if (this.jwtToken) {
          console.log(this.jwtToken);
          //localStorage.setItem('jwtToken', this.jwtToken);
          sessionStorage.setItem('jwtToken', this.jwtToken);
          console.log('Login2');
          console.log(this.jwtToken);
        }
      })
    );
  }

  // Token lekérdezése
  getToken(): string | null {
    if (!this.jwtToken) {
      //this.jwtToken = localStorage.getItem('jwtToken'); // Token betöltése localStorage-ból
      this.jwtToken = sessionStorage.getItem('jwtToken');
    }
    return this.jwtToken;
  }

  // Ellenőrizd, hogy a felhasználó be van-e jelentkezve
  isAuthenticated(): boolean {
    console.log('Auth check');
    this.jwtToken = this.getToken();
    console.log(this.jwtToken);
    console.log(!!this.jwtToken);
    return !!this.jwtToken; // Ha van token, akkor be van jelentkezve
  }
}
