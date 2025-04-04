import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VodManagementService } from '../vod-management.service';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
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
  styleUrls: ['./video-list.component.css'] // CSS FILE
})
export class VideoListComponent implements OnInit, OnDestroy{
  // URL
  private baseUrl = 'http://localhost:32006/vod'; // Nginx server to get video to play (test)

  // VIDEO ARRAYS
  videos: any[] = []; // Videos array - store videos before sorting into categories
  categories: string[] = []; // Video categories array - store categories
  videosByCategory: Record<string, any[]> = {}; // Videos array - store videos in categories (key-value)
  searchCategories: string[] = []; // Video categories array - store categories, which were selected by search
  searchedVideosByCategory: Record<string, any[]> = {}; // Videos array - store videos in categories (key-value), which were selected by search

  // BOOLEAN 
  isLoggedIn = false; // Login state (wether the user is logged in)
  isLoading = true; // Loading state (wether the page is loading)
  isSearch = false; // Search state (wether the user is using the search bar)

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
    private router: Router
  ) {
    this.init(); // Call initialize
    this.errorMessage = null; // Clear the previous error message
  }

  // Initialize
  init(): void {
    // Check the user's login status
    this.checkLoginStatus();
    // Subscribtion to the logout event
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout(); // Give the function to call when the event occurs
    });
  }

  // Initialize
  ngOnInit(): void {
    // By default, when the page is loaded there is no search
    this.isSearch = false;
    // Check the user's login status
    this.checkLoginStatus();
    // Load the videos
    this.loadVideos();
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
    if (this.isLoggedIn) {
      // If the user is logged in load the videos
      this.loadVideos();
    } 
    // else { 
    //   this.errorMessage = 'Kérjük, jelentkezzen be a videók megtekintéséhez!';
    // }
  }

  // Load and categorise videos
  loadVideos(): void {
    this.errorMessage = null; // Delete the previos error message
    this.isLoading = true; // Loading started
    this.vodService.getVideos().subscribe({
      next: (response: any[]) => {
        const groupedVideos = response.reduce((acc, video) => {
          const category = video.category || 'Egyéb';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            ...video,
            fullUrl: `${this.baseUrl}${video.path}`, // Store full URL to know from where to get the video files when playing the video
          });
          return acc;
        }, {} as Record<string, any[]>);

        this.videosByCategory = groupedVideos; // List of videos grouped by categories
        this.categories = Object.keys(this.videosByCategory); // List of categories
        this.isLoading = false; // Loading finished
      },
      error: (err) => {
        this.errorMessage = 'Hiba történt, próbáld meg később!'; // Create error message when loading vieos failed
        this.isLoading = false; // Loading finished
      },
    });
  }

  // Play selected video
  onSelectVideo(video: any): void {
    this.router.navigate(['/video-player'], // Navigate to the video-player page, pass the full URl and information about the video
      { queryParams: {
        url: video.fullUrl, // Full URL
        title: video.title, // Video's title
        description: video.description, // Video's description
        category: video.category, // Video's category
        createdAt: video.created_at, // Video's creation time
        duration: video.duration, // Video's duration
      } }); 
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
