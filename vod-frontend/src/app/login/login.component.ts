import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { Location, NgIf } from '@angular/common';
import { UserService } from '../user.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
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
  templateUrl: './login.component.html', // HTML FILE
  styleUrls: ['./login.component.css'] // CSS FILE
})
export class LoginComponent {
  // FORM
  loginForm: FormGroup; // Login form to send user data to the backend

  // STRING
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user

  // CONSTRUCTOR
  constructor(private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private location: Location,
    
  ) {
    this.loginForm = this.fb.group({ // Create login form
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
    this.errorMessage = null; // Clear the previous error message
  }

  // Login logic
  // This function is called when the user send the login form
  onLogin(): void {
    if (this.loginForm.valid) {
      this.userService.login(this.loginForm.value).subscribe({
        next: (response) => {
          // If the login was successful navigate to the home screen
          this.router.navigate(['/']);
        },
        error: (err) => {
          // If the login failed create new error message
          this.errorMessage = "Wrong username or password";
        }
      });
    }
  }

  // Back button click function
  goBack(): void {
    this.location.back(); // Navigate to the previous page
  }

  // Try again button click function
  tryAgain(): void {
    this.errorMessage = null; // Clear the previous error message
    this.loginForm = this.fb.group({ // Clear the login form
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }
}
