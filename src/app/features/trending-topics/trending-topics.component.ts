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
      category: 'Política',
      title: 'Eleições 2024: Últimas pesquisas mostram cenário acirrado',
      posts: '45.2K posts',
      timeAgo: '2h',
      isLive: true,
    },
    {
      id: '2',
      category: 'Tecnologia',
      title: 'Inteligência Artificial revoluciona setor de saúde',
      posts: '32.6K posts',
      timeAgo: '4h',
    },
    {
      id: '3',
      category: 'Esportes',
      title: 'Copa do Mundo: Brasil se classifica para as oitavas',
      posts: '78.5K posts',
      timeAgo: '1h',
    },
    {
      id: '4',
      category: 'Entretenimento',
      title: 'Netflix anuncia nova série original brasileira',
      posts: '25.1K posts',
      timeAgo: '6h',
    },
    {
      id: '5',
      category: 'Economia',
      title: 'Criptomoedas: Bitcoin atinge nova máxima histórica',
      posts: '18.9K posts',
      timeAgo: '3h',
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
