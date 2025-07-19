import { Component } from '@angular/core';
import { TrendingTopicsComponent } from "../trending-topics/trending-topics.component";
import { PostFeedComponent } from '../post/post.module';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [TrendingTopicsComponent, PostFeedComponent]
})
export class HomeComponent {
}