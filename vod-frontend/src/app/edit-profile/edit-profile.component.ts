import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { Location, NgIf } from '@angular/common';
import { UserService } from '../user.service';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  imports: [
    // ROUTER
    RouterModule,
    // ANGULAR MATERIAL MODULES
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIcon,
    // ANGULAR METHODS
    NgIf,
    // OTHER MODULES
    ReactiveFormsModule,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent {
  // FORM
  editForm: FormGroup; // Edit form to send user data to the backend

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
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private location: Location
  ) {
    this.editForm = this.fb.group({ // Create register form
      username: ['', [Validators.required]],
      email: ['', [Validators.required]],
      password: ['', []],
    });
    this.errorMessage = null; // Clear the previous error message
  }

  // Initialize
  ngOnInit(): void {
    // Check the user's login status
    this.checkLoginStatus();
    // Subscribtion to the logout event
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout(); // Give the function to call when the event occurs
    });
  
    if (this.isLoggedIn) {
      // Load existing user profile data
      this.userService.getProfile().subscribe({
        next: (data: any) => {
          this.userProfile = data; // Store user profile
  
          // Populate the form fields with user data
          this.editForm.patchValue({
            username: this.userProfile.username,
            email: this.userProfile.email,
            password: '', // Leave password empty by default
          });
        },
        error: (err) => {
          this.errorMessage = 'Cannot load user information. Please try again later.';
        }
      });
    } else {
      this.errorMessage = 'Sign in to see your profile information!';
    }
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
      this.errorMessage = 'Sign in to see your profile information!';
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
          this.errorMessage = 'Cannnot load user informations'; // Create error message when loading user data failed
        }
      });
    }
  }

  // Edit logic
  // This function is called when the user send the register form
  onEdit(): void {
    if (this.editForm.valid) {
      this.userService.edit(this.editForm.value).subscribe({
        next: (response) => {
          // If the edit was successful navigate to the profile screen
          this.router.navigate(['/profile']);
        },
        error: (err) => {
          // If the edit failed create new error message
          this.errorMessage = "Error"
        }
      });
    }
  }

  // Back button click function
  goBack(): void {
    this.location.back(); // Navigate to the previous page
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
