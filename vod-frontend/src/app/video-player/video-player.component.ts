import { Component, ElementRef, ViewChild, AfterViewInit, Input, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AnalyticsService } from '../analytics.service';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../user.service';
import { CommentSectionComponent } from '../comment-section/comment-section.component';
import { Subscription } from 'rxjs';
import Hls from 'hls.js';

@Component({
  selector: 'app-video-player',
  imports: [
    // ROUTER
    RouterModule,
    // ANGULAR MATERIAL MODULES
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    // ANGULAR METHODS
    NgIf,
    // OTHER MODULES
    CommonModule,
    // COMMENT COMPONENT
    CommentSectionComponent,
  ],
  templateUrl: './video-player.component.html', // HTML FILE
  styleUrls: ['./video-player.component.scss'] // SCSS FILE
})
export class VideoPlayerComponent implements AfterViewInit {
  // VIDEO PLAYER
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;

  // PROFILE
  userProfile: any = null; // User profile data
  
  // BOOLEAN 
  isLoggedIn = false;
  isDarkTheme = false;

  // STRING
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user
  videoTitle: string = '';
  videoDescription: string = '';
  videoCategory: string = '';
  videoCreatedAt: string = '';
  videoUrl: string = '';
  videoId: number = 0; // Video ID for comments
  @Input() videoSrc!: string;

  // NUMBER
  videoDuration: number = 0; 

  // SUBSCRIBTIONS
  private logoutSubscription!: Subscription; // Subscribtion to handle logout events

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private analyticsService: AnalyticsService,
  ) {}

  // Initialize
  ngAfterViewInit(): void {
    this.initVideoPlayer();
  }

  // Initialize
  ngOnInit(): void {
    // Set the current color theme
    this.isDarkTheme = this.userService.getTheme();
    // Check the user's login status
    this.checkLoginStatus();
    if(this.isLoggedIn){
      // If the user is logged in load the profile data
      this.loadUserProfile();
    }
    // Subscribtion to the logout event
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout(); // Give the function to call when the event occurs
    });
    if (this.isLoggedIn) {
      this.route.queryParams.subscribe(params => {
        // Set video information
        this.videoSrc = params['url'] || '';
        this.videoTitle = params['title'] || null;
        this.videoDescription = params['description'] || null;
        this.videoCategory = params['category'] || null;
        this.videoCreatedAt = params['createdAt'] || null;
        this.videoDuration = params['duration'] || null;
        this.videoDuration = parseInt(params['duration'], 10) || 0;
        this.videoId = parseInt(params['id'], 10) || 0;
  
        if (this.videoSrc) {
          this.initVideoPlayer(); // initialize video player based on URL
        } else {
          console.error('No video URL');
          this.errorMessage = "No video URL";
        }
      });
    } else {
      this.router.navigate(['/login']); // If the user is not logged in navigate to the login screen
    }
  }

  // Check the user's login status
  checkLoginStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
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

  // React to changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoSrc'] && changes['videoSrc'].currentValue) {
      this.initVideoPlayer(); // new URL, initialize new video player
    }
  }

  // Initialize the video player with HLS support
  initVideoPlayer(): void {
    // Check if the video element exists and is properly initialized
    if (!this.videoElement || !this.videoElement.nativeElement) {
        // Log an error if the video element is not available
        console.error('Video player is not available');
        return; // Exit the function early as the video player cannot be initialized
    }

    // Retrieve the native HTMLVideoElement from the Angular component's reference
    const video: HTMLVideoElement = this.videoElement.nativeElement;

    // Check if the video source URL is defined
    if (!this.videoSrc) {
        // Log an error if no video source URL is provided
        console.error('Video URL not defined');
        return; // Exit the function early as there's no source to play
    }
    
    // Check if HLS.js is supported in the current browser
    if (Hls.isSupported()) {
        // Create an instance of HLS.js to handle HTTP Live Streaming (HLS)
        const hls = new Hls();
        
        // Load the video source (HLS manifest) using HLS.js
        hls.loadSource(this.videoSrc);
        
        // Attach the HLS instance to the video element for playback
        hls.attachMedia(video);
        
        // Add an event listener to handle when the HLS manifest is fully parsed
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Log a message indicating that the video can now start playing
            console.log('HLS manifest loaded, starting playback...');
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Check if the browser natively supports HLS (usually Safari)
        video.src = this.videoSrc; // Directly set the video source for playback
    } else {
        // Log an error if neither HLS.js nor native HLS playback is supported
        console.error('HLS not supported in this browser.');
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

