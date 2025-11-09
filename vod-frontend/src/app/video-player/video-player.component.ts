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
    NgForOf,
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
  hls?: Hls;
  levels: { index: number; height?: number; bitrate?: number; label: string }[] = [];
  selectedLevel: number = -1; // -1 = Auto

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

  // Initialize the video player with HLS support and ABR
  initVideoPlayer(): void {
    // Check if the video element exists and is properly initialized
    if (!this.videoElement || !this.videoElement.nativeElement) {
        return;
    }

    const video: HTMLVideoElement = this.videoElement.nativeElement;

    // Check if the video source URL is defined
    if (!this.videoSrc) {
        return;
    }
    
    // Check if HLS.js is supported in the current browser
    if (Hls.isSupported()) {
        // HLS.js config for ABR
        const config = {
          capLevelToPlayerSize: true,    // Limit quality to player size
          startLevel: -1,                 // Auto quality at start
          maxBufferLength: 30,            // Max buffer in seconds
          maxMaxBufferLength: 120,        // Max max buffer
          enableWorker: true,             // Use web worker
          backBufferLength: 60            // Keep 60s of back buffer
        };

        // Destroy existing HLS instance if any
        if (this.hls) {
          this.hls.destroy();
        }

        // Create new HLS instance with config
        this.hls = new Hls(config);
        
        // Load the video source (HLS manifest)
        this.hls.loadSource(this.videoSrc);
        
        // Attach the HLS instance to the video element
        this.hls.attachMedia(video);
        
        // Handle manifest parsed event - populate quality levels
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest loaded, starting playback...');
            // Build levels array for quality selector
            this.levels = this.hls!.levels.map((l, i) => {
              const roundedHeight = l.height ? Math.round(l.height / 10) * 10 : undefined;
              return {
                index: i,
                height: l.height,
                bitrate: l.bitrate,
                label: roundedHeight ? `${roundedHeight}p` : `${Math.round((l.bitrate || 0) / 1000)} kbps`
              };
            });
            this.selectedLevel = -1; // Auto by default
            console.log('Available quality levels:', this.levels);
        });

        // Handle level switch event - track analytics
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (_, data: any) => {
            this.selectedLevel = data.level;
            const level = this.hls!.levels[data.level];
            console.log('Switched to quality level', data.level, level);
            // Optional: track quality changes with analytics
            if (this.userProfile) {
              this.analyticsService.trackEvent(
                this.userProfile.username, 
                'quality_switch', 
                { level: data.level, height: level?.height, bitrate: level?.bitrate }
              );
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = this.videoSrc;
    } else {
        console.error('HLS not supported in this browser.');
    }
  }

  // Manual quality selection handler
  setLevel(levelIndex: number): void {
    if (!this.hls) return;
    
    if (levelIndex === -1) {
      // Auto mode
      this.hls.currentLevel = -1;
      this.selectedLevel = -1;
      console.log('Quality set to Auto');
    } else {
      // Manual quality selection
      this.hls.currentLevel = levelIndex;
      this.selectedLevel = levelIndex;
      console.log('Quality set to', this.levels[levelIndex]?.label);
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

