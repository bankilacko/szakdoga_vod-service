import { NgForOf, NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { VodManagementService } from '../vod-management.service';
import { UserService } from '../user.service';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [
    RouterModule, // A RouterModule biztosítja a routerLink működését
    MatCardModule,
    MatButtonModule,
    NgForOf,
    NgIf,
    CommonModule,
    MatIconModule,
    MatToolbarModule,
    MatInputModule,
  ],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css']
})
export class VideoListComponent implements OnInit, OnDestroy{
  videos: any[] = [];
  videosByCategory: Record<string, any[]> = {}; // Kategorizált videók
  categories: string[] = []; // Kategóriák tömbje
  isLoggedIn = false;
  errorMessage: string | null = null;
  isLoading = true; // Betöltés állapota, kezdetben igaz
  selectedVideoUrl: string = ''; // Kiválasztott videó URL
  private baseUrl = 'http://localhost:32006/vod'; // Alap URL a videókhoz
  private logoutSubscription!: Subscription;
  @ViewChild('videoList', { static: false }) videoList!: ElementRef;

  constructor(
    private vodService: VodManagementService,
    private userService: UserService,
    private router: Router
  ) {
    this.init();
  }

  init(): void {
    console.log("init video");
    this.checkLoginStatus();
    // Feliratkozás a kijelentkezési eseményre
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      this.onLogout();
    });
  }

  ngOnInit(): void {
    this.checkLoginStatus();
    // Feliratkozás a kijelentkezési eseményre
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      console.log('Kijelentkezési esemény érkezett');
      this.onLogout();
    });
  }

  ngOnDestroy(): void {
    // Előfizetés törlése memória szivárgás elkerüléséhez
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }

  checkLoginStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
    if (this.isLoggedIn) {
      //this.loadVideos(); // Ha be van jelentkezve, azonnal töltsük le a videókat
      this.loadVideos2();
    } else {
      this.errorMessage = 'Kérjük, jelentkezzen be a videók megtekintéséhez!';
    }
  }

  loadVideos(): void {
     this.errorMessage = null; // Hibák törlése az új kérés előtt
     this.vodService.getVideos().subscribe({
       next: (response: any[]) => {
         this.videos = response.map(video => ({
           ...video,
           fullUrl: `${this.baseUrl}${video.path}` // Dinamikus URL
          
         }));
         console.log('Videos loaded:', this.videos);
         this.isLoading = false; // Betöltés befejezése
       },
       error: (err) => {
         console.error('Fail to load videos:', err);
         this.errorMessage = 'Sorry, try to login again or try again later!';
         this.isLoading = false; // Betöltés befejezése
       }
     });
  }

  // Videók betöltése és csoportosítása
  loadVideos2(): void {
    this.errorMessage = null; // Hibák törlése
    this.vodService.getVideos().subscribe({
      next: (response: any[]) => {
        const groupedVideos = response.reduce((acc, video) => {
          const category = video.category || 'Egyéb';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            ...video,
            fullUrl: `${this.baseUrl}${video.path}`, // Teljes URL
          });
          return acc;
        }, {} as Record<string, any[]>);

        this.videosByCategory = groupedVideos;
        console.log('Videos loaded:', this.videosByCategory);
        this.categories = Object.keys(this.videosByCategory); // Kategóriák listája
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Hiba történt a videók betöltésekor:', err);
        this.errorMessage = 'Hiba történt, próbáld meg később!';
        this.isLoading = false;
      },
    });
  }

  // Videó kiválasztása a lejátszáshoz
  onSelectVideo(video: any): void {
    console.log(video.duration);
    this.router.navigate(['/video-player'],
      { queryParams: {
        url: video.fullUrl,
        title: video.title,
        description: video.description,
        category: video.category,
        createdAt: video.created_at,
        duration: video.duration,
      } }); // Navigáció a lejátszó oldalra
  }

  onLogout(): void {
    // Kijelentkezési logika
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    this.userService.logout();
  }

  scrollLeft(): void {
    this.videoList.nativeElement.scrollBy({
      left: -200, // Görgetés balra (200px)
      behavior: 'smooth'
    });
  }
  
  scrollRight(): void {
    this.videoList.nativeElement.scrollBy({
      left: 200, // Görgetés jobbra (200px)
      behavior: 'smooth'
    });
  }
}
