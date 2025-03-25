import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule, // A RouterModule biztosítja a routerLink működését
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    NgForOf,
    NgIf
  ], 
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  videos = [
    { title: 'Ismerd meg Angular-t', description: 'Tanulj Angular fejlesztést!' },
    { title: 'Material Design Alapok', description: 'Dizájn tippek és trükkök.' },
    { title: 'Modern Webfejlesztés', description: 'A webfejlesztés legjobb gyakorlatai.' }
  ];

  onVideoClick(video: any): void {
    alert(`Kérlek, jelentkezz be, hogy megnézhesd: ${video.title}`);
  }
}
