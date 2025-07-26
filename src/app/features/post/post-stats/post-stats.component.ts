import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Eye, MessageCircle, Heart, Share2, Clock } from 'lucide-angular';
import { PostInteraction, PostStats } from '../../../shared/models/Post';

@Component({
  selector: 'app-post-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './post-stats.component.html',
  styles: []
})
export class PostStatsComponent {
  @Input({ required: true }) stats!: PostStats;
  @Input({ required: true }) postId!: string;
  @Output() interaction = new EventEmitter<PostInteraction>();
  @Input() comments: number = 0;

  readonly EyeIcon = Eye;
  readonly MessageCircleIcon = MessageCircle;
  readonly HeartIcon = Heart;
  readonly Share2Icon = Share2;
  readonly ClockIcon = Clock;

  onInteraction(type: PostInteraction['type']) {
    this.interaction.emit({
      id: this.postId,
      type
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

