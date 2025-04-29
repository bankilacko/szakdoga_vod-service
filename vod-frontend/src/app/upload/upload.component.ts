import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranscodingService } from '../transcoding.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AnalyticsService } from '../analytics.service';
import { NgIf, Location, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { UserService } from '../user.service';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-upload',
  imports: [
    // ROUTER
    RouterModule,
    // ANGULAR MATERIAL MODULES
    MatProgressSpinner,
    MatFormFieldModule,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatOption,
    MatSelect,
    MatIcon,
    // ANGULAR METHODS
    NgIf,
    NgFor,
    // OTHER MODULES
    ReactiveFormsModule,
  ],
  templateUrl: './upload.component.html', // HTML FILE
  styleUrl: './upload.component.scss' // SCSS FILE
})
export class UploadComponent {
  // FORM
  uploadForm: FormGroup; // Register form to send user data to the backend

  // PROFILE
  userProfile: any = null; // User profile data

  // STRING
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user
  successMessage: string | null = null; // Message to show to the user when the upload was successful
  categories: string[] = ['Animals', 'Sport', 'Music', 'Movies', 'Education', 'Transportation']; // Predefined categories
  selectedCategory: string | null = null; // The selected category

  // BOOLEAN 
  isLoggedIn = false; // Login state (wether the user is logged in)
  isLoading: boolean = false; // Loading state (when waiting for the video upload and transcoding)
  isDarkTheme = false;

  // SUBSCRIBTIONS
  private logoutSubscription!: Subscription; // Subscription to handle logout events

  // FILE
  selectedFile: File | null = null;

  // CONSTRUCTOR
  constructor(
    private transcodingService: TranscodingService,
    private userService: UserService,
    private location: Location,
    private router: Router,
    private fb: FormBuilder,
    private analyticsService: AnalyticsService,
  ) {
    this.uploadForm = this.fb.group({ // Create upload form
      file: ['', [Validators.required]],
      title: ['', [Validators.required]],
      category: ['', [Validators.required]],
      length: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  // Initialize
  ngOnInit(): void {
    this.categories.sort();
    this.errorMessage = null; // Clear the previous error message
    // Set the current color theme
    this.isDarkTheme = this.userService.getTheme();
    // Check the user's login status
    this.checkLoginStatus();
    if(this.isLoggedIn){
      this.loadUserProfile();
    }
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

  // Upload logic
  onUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = "Please select an MP4 file to upload.";
      return;
    }

    this.isLoading = true; // Start of the operation, set the loading boolean to true
  
    // Generate metadata content
    const videoName = this.selectedFile.name.replace(".mp4", "");
    const metadataFileName = `${videoName}_info.txt`;
    const metadataContent = `${this.uploadForm.get("title")?.value}\n${this.uploadForm.get("category")?.value}\n${this.uploadForm.get("length")?.value}\n${this.uploadForm.get("description")?.value}`;
  
    // Create the metadata file
    const metadataBlob = new Blob([metadataContent], { type: "text/plain" });
    const metadataFile = new File([metadataBlob], metadataFileName);
  
    // Prepare FormData for upload
    const formData = new FormData();
    formData.append("file", this.selectedFile); // Add MP4 file
    formData.append("metadata", metadataFile); // Add metadata file
  
    // Call the transcoding service
    this.transcodingService.upload(formData).subscribe({
      next: (response) => {
        console.log("File and metadata successfully uploaded:", response);
        // Track the user activity using the AnalyticsService
        this.analyticsService.trackEvent(this.userProfile.username, 'upload', {video: videoName});
        this.errorMessage = null; // Clear the error message
        this.isLoading = false; // Upload is over
        this.successMessage = "The file has been uploaded successfully!";
      },
      error: (err) => {
        // Track the user activity using the AnalyticsService
        this.analyticsService.trackEvent(this.userProfile.username, 'upload_failed', {video: videoName});
        this.isLoading = false;
        console.error("Error uploading file:", err);
        this.errorMessage = "Failed to upload the file and metadata.";
      },
    });
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

  // Change color theme (dark/light)
  changeTheme(): void {
    this.userService.switchTheme();
    this.isDarkTheme = this.userService.getTheme();
    const body = document.body;
    if (this.isDarkTheme) {
      body.classList.add('dark-theme'); // Activates dark theme
    } else {
      body.classList.remove('dark-theme'); // Activates light theme
    }
  }

  // Back button click function
  goBack(): void {
    this.location.back(); // Navigate to the previous page
  }

  // Try again button click function
  tryAgain(): void {
    this.successMessage = null;
    this.errorMessage = null;
    this.uploadForm = this.fb.group({ // Recreate upload form
      file: ['', [Validators.required]],
      title: ['', [Validators.required]],
      category: ['', [Validators.required]],
      length: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
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
    // Track the user activity using the AnalyticsService
    this.analyticsService.trackEvent(this.userProfile.username, 'log_out');
  }

}
