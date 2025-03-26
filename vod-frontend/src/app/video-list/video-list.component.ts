import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { VodManagementService } from '../vod-management.service';
import { UserService } from '../user.service';
import { MatIconModule } from '@angular/material/icon';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    NgForOf,
    CommonModule,
    MatIconModule,
    //VideoPlayerComponent,
  ],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css']
})
export class VideoListComponent {
  videos: any[] = [];
  isLoggedIn = false;
  errorMessage: string | null = null;
  selectedVideoUrl: string = ''; // Kiválasztott videó URL
  private baseUrl = 'http://localhost:32006/vod'; // ÚJ – Alap URL a videókhoz

  constructor(
    private vodService: VodManagementService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
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
        console.log('Videók betöltve:', this.videos);
      },
      error: (err) => {
        console.error('Hiba a videók betöltésekor:', err);
        this.errorMessage = 'Nem sikerült betölteni a videókat. Lehetséges, hogy lejárt a bejelentkezési idő.';
      }
    });
  }

  // Videó kiválasztása a lejátszáshoz
  onSelectVideo(videoUrl: string): void {
    this.router.navigate(['/video-player'], { queryParams: { url: videoUrl } }); // Navigáció a lejátszó oldalra
  }
}
