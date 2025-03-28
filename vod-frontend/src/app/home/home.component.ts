import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';

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
    NgIf,
  ], 
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  isLoggedIn = false;
  private logoutSubscription!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    this.init();
  }

  init(): void {
    console.log("init home");
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
  }

  videos = [
    { title: 'Ismerd meg Angular-t', description: 'Tanulj Angular fejlesztést!' },
    { title: 'Material Design Alapok', description: 'Dizájn tippek és trükkök.' },
    { title: 'Modern Webfejlesztés', description: 'A webfejlesztés legjobb gyakorlatai.' }
  ];

  onVideoClick(video: any): void {
    alert(`Kérlek, jelentkezz be, hogy megnézhesd: ${video.title}`);
  }

  onLogout(): void {
    // Kijelentkezési logika
    console.log('logout HOME');
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    console.log('logout CLICK from HOME');
    this.userService.logout();
  }
}
