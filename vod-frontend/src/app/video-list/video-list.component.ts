import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { VodManagementService } from '../vod-management.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    NgForOf,
    CommonModule,
  ],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css']
})
export class VideoListComponent {
  videos: any[] = [];
  isLoggedIn = false;
  errorMessage: string | null = null;

  constructor(
    private vodService: VodManagementService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    console.log('Login check1');
    console.log('TOKEN');
    console.log(this.userService.getToken());
    this.isLoggedIn = this.userService.isAuthenticated();
    if (this.isLoggedIn) {
      console.log('Login check2');
      this.loadVideos(); // Ha be van jelentkezve, azonnal töltsük le a videókat
    } else {
      console.log('Login check3');
      this.errorMessage = 'Kérjük, jelentkezzen be a videók megtekintéséhez!';
    }
  }

  loadVideos(): void {
    console.log('loadvideos');
    this.errorMessage = null; // Hibák törlése az új kérés előtt
    this.vodService.getVideos().subscribe({
      next: (response) => {
        this.videos = response;
        console.log('Videók betöltve:', this.videos);
      },
      error: (err) => {
        console.error('Hiba a videók betöltésekor:', err);
        this.errorMessage = 'Nem sikerült betölteni a videókat. Lehetséges, hogy lejárt a bejelentkezési idő.';
      }
    });
  }

  // videos = [
  //   {
  //     title: 'Hogyan használd az Angular-t?',
  //     subtitle: 'Angular oktatóvideó',
  //     description: 'Ebben a videóban megtudhatod, hogyan kezdj hozzá az Angular keretrendszer használatához.',
  //   },
  //   {
  //     title: 'Material Design alapok',
  //     subtitle: 'Dizájn tippek és trükkök',
  //     description: 'Ismerd meg a Material Design alapjait, és hogyan alkalmazhatod őket az Angular projektjeidben.',
  //   },
  //   {
  //     title: 'Modern Webfejlesztés',
  //     subtitle: 'HTML, CSS és JavaScript',
  //     description: 'A modern webfejlesztés legjobb gyakorlatai egy izgalmas videóban bemutatva.',
  //   },
  // ];
}
