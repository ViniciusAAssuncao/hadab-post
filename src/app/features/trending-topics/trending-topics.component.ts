import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrendingTopic } from '../../shared/models/TrendingTopic';

@Component({
  selector: 'app-trending-topics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trending-topics.component.html',
  styleUrls: ['./trending-topics.component.css'],
})
export class TrendingTopicsComponent {
  topics: TrendingTopic[] = [
    {
      id: '1',
      category: 'Diplomacia',
      title:
        'Império de Aidan impõe sanções contra membros da Suprema Corte de Berïn',
      posts: '12.8K posts',
      timeAgo: '38min',
      isLive: true,
    },
  ];

  constructor() {}

  onTopicClick(topic: TrendingTopic): void {
    console.log('Topic clicked:', topic);
  }

  onBookmarkClick(topic: TrendingTopic, event: Event): void {
    event.stopPropagation();
    console.log('Bookmark clicked:', topic);
  }

  onMoreOptionsClick(topic: TrendingTopic, event: Event): void {
    event.stopPropagation();
    console.log('More options clicked:', topic);
  }

  showMore(): void {
    console.log('Show more clicked');
  }
}
