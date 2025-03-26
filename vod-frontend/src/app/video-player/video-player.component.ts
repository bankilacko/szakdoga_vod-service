import { Component, ElementRef, ViewChild, AfterViewInit, Input, SimpleChanges } from '@angular/core';
import Hls from 'hls.js';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-player',
  imports: [
    MatCardModule,
  ],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements AfterViewInit {
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  @Input() videoSrc!: string; // Videó URL bemenete

  //videoSrc: string = 'http://localhost:32006/vod'; // m3u8 URL

  constructor(private route: ActivatedRoute) {}

  ngAfterViewInit(): void {
    this.initVideoPlayer();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['url']) { // Ellenőrizd, hogy a 'url' paraméter létezik
        this.videoSrc = params['url'].trim(); // Trim csak akkor hívódik meg, ha az érték definiált
        this.initVideoPlayer();
      } else {
        console.error('A videó URL nem érkezett meg.');
      }
    });
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
}

