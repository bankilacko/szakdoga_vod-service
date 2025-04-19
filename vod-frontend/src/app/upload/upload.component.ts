import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranscodingService } from '../transcoding.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { NgIf, Location } from '@angular/common';
import { UserService } from '../user.service';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-upload',
  imports: [
    // ROUTER
    RouterModule,
    // ANGULAR MATERIAL MODULES
    MatFormFieldModule,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIcon,
    // ANGULAR METHODS
    NgIf,
    // OTHER MODULES
    ReactiveFormsModule,
  ],
  templateUrl: './upload.component.html', // HTML FILE
  styleUrl: './upload.component.css' // CSS FILE
})
export class UploadComponent {
  // FORM
  uploadForm: FormGroup; // Register form to send user data to the backend

  // STRING
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user
  categories: string[] = ['Sports', 'Music', 'Movies', 'Education']; // Predefined categories
  selectedCategory: string | null = null; // The selected category

  // BOOLEAN 
  isLoggedIn = false; // Login state (wether the user is logged in)

  // SUBSCRIBTIONS
  private logoutSubscription!: Subscription; // SubscriBtion to handle logout events

  // FILE
  selectedFile: File | null = null;

  // CONSTRUCTOR
  constructor(
    private transcodingService: TranscodingService,
    private userService: UserService,
    private location: Location,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.uploadForm = this.fb.group({ // Create upload form
      title: ['', [Validators.required]],
      category: ['', [Validators.required]],
      length: ['', [Validators.required]],
      description: ['', [Validators.required]],
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
  }

  // Check the user's login status
  checkLoginStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement; // Access the input element
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Store the selected file
    } else {
      this.errorMessage = "No file selected.";
    }
  }

  // Upload the selected file
  onUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = "Please select an MP4 file to upload.";
      return;
    }

    const formData = new FormData();
    formData.append("file", this.selectedFile); // Attach the file to the request

    // Call TranscodingService to upload the file
    this.transcodingService.upload(formData).subscribe({
      next: (response) => {
        console.log("File successfully uploaded:", response);
        this.errorMessage = null; // Clear the error message
      },
      error: (err) => {
        console.error("Error uploading file:", err);
        this.errorMessage = "Failed to upload the file. Please try again.";
      },
    });
  }

  // Back button click function
  goBack(): void {
    this.location.back(); // Navigate to the previous page
  }

  // Try again button click function
  tryAgain(): void {
    
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
