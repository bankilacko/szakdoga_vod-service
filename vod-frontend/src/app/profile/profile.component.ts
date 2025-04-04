import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [
    // ROUTER
    RouterModule,
    // ANGULAR MATERIAL MODULES
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    // ANGULAR METHODS
    NgIf,
    // OTHER MODULES
    CommonModule,
  ],
  templateUrl: './profile.component.html', // HTML FILE
  styleUrls: ['./profile.component.css'] // HTML FILE
})

export class ProfileComponent implements OnInit {
  // ARRAY
  userProfile: any = null; // User profile data

  // BOOLEAN
  isLoggedIn = false; // Login state (wether the user is logged in)

  // STRING
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user
  

  // SUBSCRIBTIONS
  private logoutSubscription!: Subscription; // SubscriBtion to handle logout events

  // CONSTRUCTOR
  constructor(
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {
    this.init(); // Call initialize
    this.errorMessage = null; // Clear the previous error message
  }

  // Initialize
  init(): void {
    // Check the user's login status
    this.checkLoginStatus();
    // Subscribtion to the logout event
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout(); // Give the function to call when the event occurs
    });
  }

  // Initialize
  ngOnInit(): void {
    // Check the user's login status
    this.checkLoginStatus();
    // Subscribtion to the logout event
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout(); // Give the function to call when the event occurs
    });
  }

  // Destroy
  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leak
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }

  // Check the user's login status
  checkLoginStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
    if (this.isLoggedIn) {
      // If the user is logged in load the prifile data
      this.loadUserProfile();
    } else {
      this.errorMessage = 'Kérjük, jelentkezzen be az adatok megtekintéséhez!';
    }
  }

  // Load user data
  loadUserProfile(): void {
    this.errorMessage = null; // Delete the previos error message
    if (this.isLoggedIn) {
      this.userService.getProfile().subscribe({
        next: (data: any) => {
          this.userProfile = data; // Store the user's data
        },
        error: (err) => { 
          this.errorMessage = 'Nem sikerült betölteni a felhasználói adatokat.'; // Create error message when loading user data failed
        }
      });
    }
  }

  // Edit profile data
  editProfile(): void {
    this.router.navigate(['/edit-profile']); // Navigate to the edit-profil page
  }

  // Logout logic
  // The function is called when the logout event occurs
  onLogout(): void {
    this.isLoggedIn = false; // Logged in state is over 
    this.router.navigate(['/']); // Navigate to the home page
  }

  // Logout event
  // The function calls the user service's function, to generate a logout event occurs
  logout(): void {
    this.userService.logout(); // Call user-service logout function
  }
}
