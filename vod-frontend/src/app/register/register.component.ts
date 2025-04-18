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
  selector: 'app-register',
  standalone: true, // Standalone mód
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
  templateUrl: './register.component.html', // HTML FILE
  styleUrl: './register.component.css' // CSS FILE
})
export class RegisterComponent {
  // FORM
  registerForm: FormGroup; // Register form to send user data to the backend

  // STRING
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user

  // CONSTRUCTOR
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private location: Location
  ) {
    this.registerForm = this.fb.group({ // Create register form
      username: ['', [Validators.required]],
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.errorMessage = null; // Clear the previous error message
  }

  // Registration logic
  // This function is called when the user send the register form
  onRegister(): void {
    if (this.registerForm.valid) {
      this.userService.register(this.registerForm.value).subscribe({
        next: (response) => {
          // If the registration was successful navigate to the login screen
          this.router.navigate(['/login']);
        },
        error: (err) => {
          // If the registration failed create new error message
          this.errorMessage = "Username or email already exists"
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
    this.registerForm = this.fb.group({ // Clear the register form
      username: ['', [Validators.required]],
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }
}


