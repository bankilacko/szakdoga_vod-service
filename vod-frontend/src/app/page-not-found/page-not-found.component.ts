import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [
    MatCardModule
  ],
  templateUrl: './page-not-found.component.html', // HTML FILE
  styleUrl: './page-not-found.component.scss' // SCSS FILE
})
export class PageNotFoundComponent {

}
