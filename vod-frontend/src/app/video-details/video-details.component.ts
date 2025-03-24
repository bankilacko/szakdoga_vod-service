import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-details',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './video-details.component.html',
  styleUrls: ['./video-details.component.css']
})
export class VideoDetailsComponent implements OnInit {
  video = {
    title: 'Hogyan használd az Angular-t?',
    category: 'Oktatóvideó',
    description: 'Ebben a részletes oktatóvideóban bemutatjuk, hogyan építhetsz dinamikus és modern alkalmazásokat az Angular segítségével.'
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const videoId = this.route.snapshot.paramMap.get('id');
    console.log('Video ID:', videoId);
    // TODO: Videó részleteit dinamikusan töltsd be, pl. API-ból
  }
}