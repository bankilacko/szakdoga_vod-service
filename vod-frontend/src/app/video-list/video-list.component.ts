import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { VodManagementService } from '../vod-management.service';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AnalyticsService } from '../analytics.service';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../user.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [
    // ROUTER
    RouterModule,
    // ANGULAR MATERIAL MODULES
    MatProgressSpinner,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    // ANGULAR METHODS
    NgForOf,
    NgIf,
    // OTHER MODULES
    CommonModule,
    FormsModule,
  ],
  templateUrl: './video-list.component.html', // HTML FILE
  styleUrls: ['./video-list.component.scss'] // SCSS FILE
})
export class VideoListComponent implements OnInit, OnDestroy{
  // URL
  //private baseUrl = 'http://152.66.245.139:22292/vod'; // Nginx server to get video to play (VM with port forwarding)
  private baseUrl = 'http://localhost:7000/vod'; // Nginx server to get video to play (test)

  // PROFILE
  userProfile: any = null; // User profile data

  // VIDEO ARRAYS
  videos: any[] = []; // Videos array - store videos before sorting into categories
  categories: string[] = []; // Video categories array - store categories
  videosByCategory: Record<string, any[]> = {}; // Videos array - store videos in categories (key-value)
  searchCategories: string[] = []; // Video categories array - store categories, which were selected by search
  searchedVideosByCategory: Record<string, any[]> = {}; // Videos array - store videos in categories (key-value), which were selected by search
  recentlyWatchedVideos: string[] = []; // The 3 recently watched videos' title by the current user, get from the analytics service
  recentlyWatchedVideoList: any[] = []; // The 3 recently watched video objects by the current user, get from the analytics service
  recommendedVideos: string[] = []; // Recommended videos' titles for the current user
  recommendedVideoList: any[] = []; // Recommended video objects for the current user

  // BOOLEAN 
  isLoggedIn = false; // Login state (wether the user is logged in)
  isLoading = true; // Loading state (wether the page is loading)
  isSearch = false; // Search state (wether the user is using the search bar)
  isDarkTheme = false;

  // STRING
  selectedVideoUrl: string = ''; // Selected video's URL
  errorMessage: string | null = null; // Error message, value based on the error type and displayed on the page to help the user
  searchQuery: string = ''; // Searched word or expression, used to find the desired video(s)
  
  // SUBSCRIBTIONS
  private logoutSubscription!: Subscription; // SubscriBtion to handle logout events

  // CHILDS
  @ViewChild('videoList', { static: false }) videoList!: ElementRef;
   
  // CONSTRUCTOR
  constructor(
    private vodService: VodManagementService,
    private userService: UserService,
    private router: Router,
    private analyticsService: AnalyticsService,
  ) {
  }

  // Initialize
  async ngOnInit(): Promise<void> {
    // Load the videos
    await this.loadVideos();
    // Check the user's login status
    this.checkLoginStatus();
    if(this.isLoggedIn){
      // If the user is logged in load the profile data
      await this.loadUserProfile();
      this.getRecentlyWatchedVideos();
      this.getRecommendedVideos();
    }  
    // Clear the previous error message
    this.errorMessage = null;
    // By default, when the page is loaded there is no search
    this.isSearch = false;
    // Set the current color theme
    this.isDarkTheme = this.userService.getTheme();
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
  }

  // Load and categorise videos
  loadVideos(): Promise<void> {
    this.errorMessage = null; // Delete previous error message
    this.isLoading = true; // Start loading
  
    return new Promise((resolve, reject) => {
      this.vodService.getVideos().subscribe({
        next: (response: any[]) => {
          this.videos = response;

          const groupedVideos = response.reduce((acc, video) => {
            const category = video.category || 'Other';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push({
              ...video,
              fullUrl: `${this.baseUrl}${video.path}`, // Store full video URL
              viewCount: 0, // Initialize view count
              commentCount: 0, // Initialize comment count
            });
            return acc;
          }, {} as Record<string, any[]>);
  
          this.videosByCategory = groupedVideos; // Grouped videos by category
          this.categories = Object.keys(this.videosByCategory); // List of categories
          this.isLoading = false; // Loading finished
  
          // Load view counts and comment counts for all videos
          this.loadViewCounts();
          this.loadCommentCounts();
  
          console.log("Videos loaded successfully.");
          resolve(); // Resolve the Promise when loading is complete
        },
        error: (err) => {
          this.errorMessage = 'An error occurred, try again later!'; // Error message when loading fails
          this.isLoading = false; // Stop loading
  
          console.error("Error loading videos:", err);
          reject(err); // Reject the Promise if an error occurs
        },
      });
    });
  }
  

  // Get the 3 recently watched videos from the analytics service
  getRecentlyWatchedVideos(): void {
    this.recentlyWatchedVideoList = [];
    this.analyticsService.getRecentVideos(this.userProfile.username).subscribe({
      next: (response: any) => {
        console.log('Received recently watched video titles:', response.recent_videos);
        this.recentlyWatchedVideos = response.recent_videos || [];
        

        // Search the video object by title in the videos array
        for (let videoTitle of this.recentlyWatchedVideos) {
          for (let video of this.videos) {
            if(video.title == videoTitle){
              console.log(`Match found: ${video.title}`);
              const videoObj = {
                ...video,
                fullUrl: `${this.baseUrl}${video.path}`,
                viewCount: video.viewCount || 0,
                commentCount: video.commentCount || 0
              };
              this.recentlyWatchedVideoList.push(videoObj);
              // Load view count for this video
              this.analyticsService.getVideoViewCount(videoTitle).subscribe({
                next: (viewCountResponse: any) => {
                  videoObj.viewCount = viewCountResponse.view_count || 0;
                },
                error: (err) => {
                  console.error(`Error fetching view count for ${videoTitle}:`, err);
                  videoObj.viewCount = 0;
                },
              });
              // Load comment count for this video
              if (video.id) {
                this.vodService.getVideoCommentCount(video.id).subscribe({
                  next: (commentCountResponse: any) => {
                    videoObj.commentCount = commentCountResponse.comment_count || 0;
                  },
                  error: (err) => {
                    console.error(`Error fetching comment count for video ID ${video.id}:`, err);
                    videoObj.commentCount = 0;
                  },
                });
              }
            }
          }
        }

        //console.log('Received recently watched videos:', this.recentlyWatchedVideoList);
      },
      error: (err) => {
        console.error('Error fetching recently watched videos:', err);
      },
    });
  }

  // Get recommended videos from the analytics service
  getRecommendedVideos(): void {
    this.recommendedVideoList = [];
    this.analyticsService.getRecommendations(this.userProfile.username).subscribe({
      next: (response: any) => {
        console.log('Received recommended video titles:', response.recommendations);
        this.recommendedVideos = response.recommendations || [];
        
        // Search the video object by title in the videos array
        for (let videoTitle of this.recommendedVideos) {
          for (let video of this.videos) {
            if(video.title == videoTitle){
              console.log(`Match found for recommended video: ${video.title}`);
              const videoObj = {
                ...video,
                fullUrl: `${this.baseUrl}${video.path}`,
                viewCount: video.viewCount || 0,
                commentCount: video.commentCount || 0
              };
              this.recommendedVideoList.push(videoObj);
              // Load view count for this video
              this.analyticsService.getVideoViewCount(videoTitle).subscribe({
                next: (viewCountResponse: any) => {
                  videoObj.viewCount = viewCountResponse.view_count || 0;
                },
                error: (err) => {
                  console.error(`Error fetching view count for ${videoTitle}:`, err);
                  videoObj.viewCount = 0;
                },
              });
              // Load comment count for this video
              if (video.id) {
                this.vodService.getVideoCommentCount(video.id).subscribe({
                  next: (commentCountResponse: any) => {
                    videoObj.commentCount = commentCountResponse.comment_count || 0;
                  },
                  error: (err) => {
                    console.error(`Error fetching comment count for video ID ${video.id}:`, err);
                    videoObj.commentCount = 0;
                  },
                });
              }
            }
          }
        }
      },
      error: (err) => {
        console.error('Error fetching recommended videos:', err);
      },
    });
  }

  // Load view counts for all videos
  loadViewCounts(): void {
    // Load view counts for all videos in all categories
    // Note: videosByCategory contains the same video objects as videos array, so we only need to iterate once
    const processedTitles = new Set<string>();
    for (let category in this.videosByCategory) {
      for (let video of this.videosByCategory[category]) {
        if (processedTitles.has(video.title)) {
          continue; // Skip if we already processed this video
        }
        processedTitles.add(video.title);
        this.analyticsService.getVideoViewCount(video.title).subscribe({
          next: (response: any) => {
            video.viewCount = response.view_count || 0;
            // Also update in main videos array if it exists
            const mainVideo = this.videos.find(v => v.title === video.title);
            if (mainVideo) {
              mainVideo.viewCount = response.view_count || 0;
            }
          },
          error: (err) => {
            console.error(`Error fetching view count for ${video.title}:`, err);
            video.viewCount = 0;
            // Also update in main videos array if it exists
            const mainVideo = this.videos.find(v => v.title === video.title);
            if (mainVideo) {
              mainVideo.viewCount = 0;
            }
          },
        });
      }
    }
  }

  // Load comment counts for all videos
  loadCommentCounts(): void {
    // Load comment counts for all videos in all categories
    const processedIds = new Set<number>();
    for (let category in this.videosByCategory) {
      for (let video of this.videosByCategory[category]) {
        if (!video.id || processedIds.has(video.id)) {
          continue; // Skip if no ID or already processed
        }
        processedIds.add(video.id);
        this.vodService.getVideoCommentCount(video.id).subscribe({
          next: (response: any) => {
            video.commentCount = response.comment_count || 0;
            // Also update in main videos array if it exists
            const mainVideo = this.videos.find(v => v.id === video.id);
            if (mainVideo) {
              mainVideo.commentCount = response.comment_count || 0;
            }
          },
          error: (err) => {
            console.error(`Error fetching comment count for video ID ${video.id}:`, err);
            video.commentCount = 0;
            // Also update in main videos array if it exists
            const mainVideo = this.videos.find(v => v.id === video.id);
            if (mainVideo) {
              mainVideo.commentCount = 0;
            }
          },
        });
      }
    }
  }

  // Play selected video
  onSelectVideo(video: any): void {
    console.log(video.fullUrl);
    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/video-player'], // Navigate to the video-player page, pass the full URl and information about the video
      { queryParams: {
        url: video.fullUrl, // Full URL
        title: video.title, // Video's title
        description: video.description, // Video's description
        category: video.category, // Video's category
        createdAt: video.created_at, // Video's creation time
        duration: video.duration, // Video's duration
        id: video.id, // Video's ID for comments
      } }).then(() => {
        // Scroll to top after navigation completes
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }, 100);
      });
      // Track event with video_id, title, and category (only if user is logged in)
      if (this.isLoggedIn && this.userProfile && this.userProfile.username) {
        this.analyticsService.trackEvent(this.userProfile.username, 'play-video', {
          video: video.title,
          video_id: video.id,
          category: video.category
        });
      }
  }

  // Load user data
  // Returns promise to guarantee that the profile data is loaded before trying to fetch the users recently watched videos
  loadUserProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.errorMessage = null; // Reset previous error message
      if (this.isLoggedIn) {
        this.userService.getProfile().subscribe({
          next: (data: any) => {
            this.userProfile = data; // Store the user's data
            console.log("User profile loaded successfully:", this.userProfile.username);
            resolve(); // Signal that profile loading is complete
          },
          error: (err) => { 
            this.errorMessage = 'Cannot load user information'; // Display error message
            console.error("Error loading user profile:", err);
            reject(err); // Signal that an error occurred
          }
        });
      } else {
        console.warn("User is not logged in, skipping profile load.");
        resolve(); // No action needed, but prevent blocking further execution
      }
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

  // Scroll left function
  scrollLeft(): void {
    this.videoList.nativeElement.scrollBy({
      left: -200, // Scroll left (200px)
      behavior: 'smooth'
    });
  }
  
  // Scroll right function
  scrollRight(): void {
    this.videoList.nativeElement.scrollBy({
      left: 200, // Scroll right (200px)
      behavior: 'smooth'
    });
  }

  // Search logic
  // The function is called when the search button/enter is pressed while searching
  search(): void {
    this.errorMessage = ""; // Delete the previous error message
    // Check wether anything is typed in the searchbar
    if (this.searchQuery.trim() === '') {
      this.isSearch = false; // If the searchbar is empty finish the search state
      this.searchedVideosByCategory = {}; // Empty the previous search result categories
    } else {
      this.isSearch = true; // If the searchbar contains text start search state
      this.searchCategories = this.filteredCategories(); // Search the videocategories which contain the search video(s)
      this.searchedVideosByCategory = {}; // Empty the previous search result videos
  
      // Go through the selected categories, and collect the searched videos
      for (let c of this.searchCategories) {
        this.searchedVideosByCategory[c] = this.filteredVideos(c); // Collect the videos
      }
    }

    // If no video matches the search text
    if(this.searchCategories.length == 0 ) this.errorMessage = "No video matches your search"; // Set error message to inform the user
  }

  // Filter categories
  filteredCategories(): string[] {
    // Chech wether the category or its videos match the search requirement
    return Object.keys(this.videosByCategory).filter(category =>
      (category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      this.videosByCategory[category].some(video =>
        video.title.toLowerCase().includes(this.searchQuery.toLowerCase()))
      ) &&
      this.filteredVideos(category).length > 0 // Only add the category to the results if it has at least one video matches the search
    );
  }

  // Filter videos
  filteredVideos(category: string): any[] {
    // Chech wether the videos int the category (given in parameter) match the search requirement
    return this.videosByCategory[category]?.filter(video =>
      video.title.toLowerCase().includes(this.searchQuery.toLowerCase()) // Search for videos name 
      //|| category.toLowerCase().includes(this.searchQuery.toLowerCase()) // Search for category name as well
    ) || [];
  }

  // Home button/application name click function
  home(): void {
    this.isSearch = false;
    this.searchQuery = '';
    this.loadVideos();
  }
}
