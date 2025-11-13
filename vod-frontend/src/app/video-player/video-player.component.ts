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
  videoViewCount: number = 0; // View count for the current video 

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
    // Scroll to top when component initializes
    window.scrollTo({ top: 0, behavior: 'instant' });
    
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
          // Load view count for this video
          if (this.videoTitle) {
            this.getVideoViewCount();
          }
          // Scroll to top after video loads
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }, 100);
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

  // Get video view count
  getVideoViewCount(): void {
    if (!this.videoTitle) {
      return;
    }
    this.analyticsService.getVideoViewCount(this.videoTitle).subscribe({
      next: (response: any) => {
        this.videoViewCount = response.view_count || 0;
      },
      error: (err) => {
        console.error('Error fetching view count:', err);
        this.videoViewCount = 0;
      },
    });
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
            // Build levels array for quality selector
            this.levels = this.hls!.levels.map((l, i) => {
              const roundedHeight = l.height ? Math.round(l.height / 10) * 10 : undefined;
              // For old videos without quality info, default to 720p
              let label: string;
              if (roundedHeight) {
                label = `${roundedHeight}p`;
              } else if (l.bitrate && l.bitrate > 0) {
                label = `${Math.round(l.bitrate / 1000)} kbps`;
              } else {
                // No height or bitrate info (old single-quality video), default to 720p
                label = '720p';
              }
              return {
                index: i,
                height: l.height || 720,
                bitrate: l.bitrate || 0,
                label: label
              };
            });
            // Set to Auto mode (-1) and ensure HLS.js uses Auto
            this.selectedLevel = -1;
            if (this.hls) {
                this.hls.currentLevel = -1; // Explicitly set to Auto
            }
        });

        // Handle level switch event - track analytics
        // Only update selectedLevel if we're in manual mode (not Auto)
        // In Auto mode, HLS.js will automatically switch levels, but we want to keep selectedLevel = -1
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (_, data: any) => {
            // Only update if we're not in Auto mode (selectedLevel !== -1 means manual mode)
            if (this.selectedLevel !== -1) {
                this.selectedLevel = data.level;
            }
            const level = this.hls!.levels[data.level];
            // Optional: track quality changes with analytics (only for manual switches)
            if (this.userProfile && this.selectedLevel !== -1) {
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

