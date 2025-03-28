import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatInputModule,
    NgIf,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

export class ProfileComponent implements OnInit {
  userProfile: any = null; // Felhasználói adatok tárolása
  errorMessage: string | null = null; // Hibaüzenetek kezelése
  isLoggedIn = false; //Bejelentkezett státusz
  private logoutSubscription!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {
    this.init();
  }

  init(): void {
    console.log("init profile");
    this.checkLoginStatus();
    // Feliratkozás a kijelentkezési eseményre
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout();
    });
  }

  ngOnInit(): void {
    this.checkLoginStatus();
    // Feliratkozás a kijelentkezési eseményre
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      console.log('Kijelentkezési esemény érkezett');
      this.onLogout();
    });
  }

  ngOnDestroy(): void {
    // Előfizetés törlése memória szivárgás elkerüléséhez
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }

  checkLoginStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
    if (this.isLoggedIn) {
      this.loadUserProfile(); // Betöltjük a felhasználó adatait
    } else {
      this.errorMessage = 'Kérjük, jelentkezzen be az adatok megtekintéséhez!';
    }
    
  }

  loadUserProfile(): void {
    this.errorMessage = null; // Hibák törlése az új kérés előtt
    if (this.isLoggedIn) {
      this.userService.getProfile().subscribe({
        next: (data: any) => {
          this.userProfile = data; // Felhasználói adatok mentése
          console.log('Felhasználói adatok betöltve:', this.userProfile);
        },
        error: (err) => {
          console.error('Hiba a felhasználói adatok lekérésekor:', err);
          this.errorMessage = 'Nem sikerült betölteni a felhasználói adatokat.';
        }
      });
    }
  }

  editProfile(): void {
    console.log('Profil szerkesztése');
    // Navigálás egy szerkesztő oldalra, például:
    this.router.navigate(['/edit-profile']);
  }

  onLogout(): void {
    // Kijelentkezési logika
    console.log('logout PROFILE');
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    console.log('logout CLICK from PROFILE');
    this.userService.logout();
  }
}
