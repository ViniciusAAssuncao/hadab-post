import { Component } from '@angular/core';
import { TrendingTopicsComponent } from "../trending-topics/trending-topics.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [TrendingTopicsComponent]
})
export class HomeComponent {
}