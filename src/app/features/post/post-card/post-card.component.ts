import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, MoreHorizontal, TrendingUp } from 'lucide-angular';
import { PostStatsComponent } from '../post-stats/post-stats.component';
import { PostAuthorComponent } from '../post-author/post-author.component';
import { Post, PostInteraction } from '../../../shared/models/Post';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule,
    PostStatsComponent,
    PostAuthorComponent
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Input() isLast: boolean = false;
  @Output() interaction = new EventEmitter<PostInteraction>();
  @Output() postClick = new EventEmitter<Post>();

  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly TrendingUpIcon = TrendingUp;

  onInteraction(interaction: PostInteraction) {
    this.interaction.emit(interaction);
  }

  onPostClick() {
    this.postClick.emit(this.post);
  }
}