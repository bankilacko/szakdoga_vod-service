import { Routes } from '@angular/router';
import { VideoListComponent } from './video-list/video-list.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VideoDetailsComponent } from './video-details/video-details.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
  { path: '', component: VideoListComponent }, // Kezdőlap
  { path: 'login', component: LoginComponent }, // Bejelentkezés
  { path: 'register', component: RegisterComponent }, // Regisztráció
  { path: 'video/:id', component: VideoDetailsComponent }, // Videó részletei
  { path: '**', component: PageNotFoundComponent } // Hibaoldal
];