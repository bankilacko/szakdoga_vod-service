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
import { FormsModule } from '@angular/forms';

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
    FormsModule,
  ],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css']
})
export class VideoListComponent implements OnInit, OnDestroy{
  videos: any[] = [];
  videosByCategory: Record<string, any[]> = {}; // Kategorizált videók
  searchedVideosByCategory: Record<string, any[]> = {}; // Keresésnek megfelelő kategorizált videók
  categories: string[] = []; // Kategóriák tömbje
  searchCategories: string[] = [];
  isLoggedIn = false;
  errorMessage: string | null = null;
  isLoading = true; // Betöltés állapota, kezdetben igaz
  selectedVideoUrl: string = ''; // Kiválasztott videó URL
  private baseUrl = 'http://localhost:32006/vod'; // Alap URL a videókhoz
  private logoutSubscription!: Subscription;
  @ViewChild('videoList', { static: false }) videoList!: ElementRef;
  searchQuery: string = ''; // Keresési kulcsszó
  isSearch = false;

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
    this.isSearch = false;
    this.checkLoginStatus();
    console.log(this.isLoggedIn);
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
      this.loadVideos();
    } else {
      this.errorMessage = 'Kérjük, jelentkezzen be a videók megtekintéséhez!';
    }
  }

  // Videók betöltése és csoportosítása
  loadVideos(): void {
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

  search(): void {
    this.errorMessage = "";
    if (this.searchQuery.trim() === '') {
      this.isSearch = false;
      this.searchedVideosByCategory = {}; // Ürítjük az előző keresést
    } else {
      this.isSearch = true;
      this.searchCategories = this.filteredCategories();
      this.searchedVideosByCategory = {}; // Új kereséshez újra inicializáljuk
  
      for (let c of this.searchCategories) {
        this.searchedVideosByCategory[c] = this.filteredVideos(c); // Közvetlen hozzárendelés a tömbhöz
      }
    }

    if(this.searchCategories.length == 0 ) this.errorMessage = "No video matches your search";
  
    console.log("Szűrt kategóriák:", this.searchCategories);
    console.log("Szűrt videók:", this.searchedVideosByCategory);
  }

  filteredCategories(): string[] {
    console.log("Keresési kulcsszó:", this.searchQuery);

    return Object.keys(this.videosByCategory).filter(category =>
      (category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      this.videosByCategory[category].some(video =>
        video.title.toLowerCase().includes(this.searchQuery.toLowerCase()))
      ) &&
      this.filteredVideos(category).length > 0 // Csak akkor jelenik meg a kategória, ha van benne találat
    );
  }

  filteredVideos(category: string): any[] {
    console.log("Szűrés kategória és cím alapján:", category, this.searchQuery);
    return this.videosByCategory[category]?.filter(video =>
      video.title.toLowerCase().includes(this.searchQuery.toLowerCase()) //||
      //category.toLowerCase().includes(this.searchQuery.toLowerCase()) // Kategória nevére is keresünk
    ) || [];
  }

  home(): void {
    this.isSearch = false;
    this.searchQuery = '';
    this.loadVideos();
  }
}
