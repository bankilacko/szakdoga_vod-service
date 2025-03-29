import { NgForOf, NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
  isLoggedIn = false;
  errorMessage: string | null = null;
  isLoading = true; // Betöltés állapota, kezdetben igaz
  selectedVideoUrl: string = ''; // Kiválasztott videó URL
  private baseUrl = 'http://localhost:32006/vod'; // Alap URL a videókhoz
  private logoutSubscription!: Subscription;

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
    this.loadVideos();
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
      this.loadVideos(); // Ha be van jelentkezve, azonnal töltsük le a videókat
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

  // Videó kiválasztása a lejátszáshoz
  onSelectVideo(videoUrl: string): void {
    this.router.navigate(['/video-player'], { queryParams: { url: videoUrl } }); // Navigáció a lejátszó oldalra
  }

  onLogout(): void {
    // Kijelentkezési logika
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    this.userService.logout();
  }
}
