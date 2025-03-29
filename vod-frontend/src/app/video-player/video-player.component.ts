import { Component, ElementRef, ViewChild, AfterViewInit, Input, SimpleChanges } from '@angular/core';
import Hls from 'hls.js';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-video-player',
  imports: [
    RouterModule, // A RouterModule biztosítja a routerLink működését
    MatCardModule,
    MatButtonModule,
    NgIf,
    CommonModule,
    MatIconModule,
    MatToolbarModule,
    MatInputModule,
  ],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements AfterViewInit {
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  @Input() videoSrc!: string; // Videó URL bemenete
  isLoggedIn = false;
  private logoutSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
  ) {}

  ngAfterViewInit(): void {
    this.initVideoPlayer();
  }

  ngOnInit(): void {
    this.checkLoginStatus();
    // Feliratkozás a kijelentkezési eseményre
    this.logoutSubscription = this.userService.onLogout().subscribe(() => {
      console.log('Kijelentkezési esemény érkezett');
      this.onLogout();
    });
    if(this.isLoggedIn){
      this.route.queryParams.subscribe(params => {
        if (params['url']) { // Ellenőrizd, hogy a 'url' paraméter létezik
          this.videoSrc = params['url'].trim(); // Trim csak akkor hívódik meg, ha az érték definiált
          this.initVideoPlayer();
        } else {
          console.error('A videó URL nem érkezett meg.');
        }
      });
    }
    else this.router.navigate(['/login']);
  }

  checkLoginStatus(): void {
    this.isLoggedIn = this.userService.isAuthenticated();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoSrc'] && changes['videoSrc'].currentValue) {
      this.initVideoPlayer(); // Új URL érkezett, lejátszás inicializálása
    }
  }

  initVideoPlayer(): void {
    if (!this.videoElement || !this.videoElement.nativeElement) {
      console.error('A videoPlayer elem nem érhető el.');
      return;
    }

    const video: HTMLVideoElement = this.videoElement.nativeElement;

    if (!this.videoSrc) {
      console.error('A videó URL nincs definiálva.');
      return;
    }
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(this.videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded, starting playback...');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Támogatja a natív HLS-t (pl. Safari böngésző)
      video.src = this.videoSrc;
    } else {
      console.error('HLS not supported in this browser.');
    }
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

