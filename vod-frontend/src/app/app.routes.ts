import { Routes, RouterModule } from '@angular/router';
import { VideoListComponent } from './video-list/video-list.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VideoDetailsComponent } from './video-details/video-details.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { HomeComponent } from './home/home.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { NgModule } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'video-list', component: VideoListComponent }, // Videók listája
  { path: 'login', component: LoginComponent }, // Bejelentkezés
  { path: 'register', component: RegisterComponent }, // Regisztráció
  { path: 'profile', component: ProfileComponent }, // Profil
  { path: 'video/:id', component: VideoDetailsComponent }, // Videó részletei
  { path: 'video-player', component: VideoPlayerComponent }, // Videó lejátszása
  { path: '**', component: PageNotFoundComponent } // Hibaoldal
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Itt importáljuk a RouterModule-t
  exports: [RouterModule]
})
export class AppRoutingModule {}