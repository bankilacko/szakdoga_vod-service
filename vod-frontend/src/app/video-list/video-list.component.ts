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
  private baseUrl = 'http://152.66.245.139:22292/vod'; // Nginx server to get video to play (VM with port forwarding)
  //private baseUrl = 'http://localhost:7000/vod'; // Local development

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
            });
            return acc;
          }, {} as Record<string, any[]>);
  
          this.videosByCategory = groupedVideos; // Grouped videos by category
          this.categories = Object.keys(this.videosByCategory); // List of categories
          this.isLoading = false; // Loading finished
  
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
              this.recentlyWatchedVideoList.push({
                ...video,
                fullUrl: `${this.baseUrl}${video.path}`
              });
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

  // Play selected video
  onSelectVideo(video: any): void {
    console.log(video.fullUrl);
    this.router.navigate(['/video-player'], // Navigate to the video-player page, pass the full URl and information about the video
      { queryParams: {
        url: video.fullUrl, // Full URL
        title: video.title, // Video's title
        description: video.description, // Video's description
        category: video.category, // Video's category
        createdAt: video.created_at, // Video's creation time
        duration: video.duration, // Video's duration
      } });
      this.analyticsService.trackEvent(this.userProfile.username, 'play-video', {video: video.title}); 
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
