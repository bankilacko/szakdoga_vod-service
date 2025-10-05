import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { VideoListComponent } from './video-list/video-list.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { UploadComponent } from './upload/upload.component';
import { LoginComponent } from './login/login.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

export const routes: Routes = [
  { path: '', component: VideoListComponent }, // HOME/VIDEO-LIST COMPONENT/PAGE
  { path: 'login', component: LoginComponent }, // LOGIN COMPONENT/PAGE
  { path: 'register', component: RegisterComponent }, // REGISTRATION COMPONENT/PAGE
  { path: 'profile', component: ProfileComponent }, // PROFILE COMPONENT/PAGE
  { path: 'video-player', component: VideoPlayerComponent }, // VIDEO-PLAYER COMPONENT/PAGE
  { path: 'edit-profile', component: EditProfileComponent }, // EDIT_PROFILE COMPONENT/PAGE
  { path: 'upload', component: UploadComponent }, // UPLOAD COMPONENT/PAGE
  { path: '**', component: PageNotFoundComponent } // PAGE-NOT-FOUND COMPONENT/PAGE
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}