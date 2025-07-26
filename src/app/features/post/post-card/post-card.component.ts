import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-angular';
import { PostStatsComponent } from '../post-stats/post-stats.component';
import { PostAuthorComponent } from '../post-author/post-author.component';
import { Post, PostInteraction } from '../../../shared/models/Post';
import { Nl2brPipe } from '../../../shared/pipes/nl2br.pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    PostStatsComponent,
    PostAuthorComponent,
    Nl2brPipe,
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css'],
})
export class PostCardComponent {
  @Input() isLast: boolean = false;
  @Input() isFirst: boolean = false;
  @Output() interaction = new EventEmitter<PostInteraction>();
  @Output() postClick = new EventEmitter<Post>();

  @Input({ required: true })
  set post(value: Post) {
    this._post = value;
    this.isLongContent = value.content ? value.content.length > 300 : false;
  }
  get post(): Post {
    return this._post;
  }
  private _post!: Post;

  isExpanded = false;
  isLongContent = false;

  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly TrendingUpIcon = TrendingUp;

  constructor(private router: Router) {}

  onInteraction(interaction: PostInteraction) {
    this.interaction.emit(interaction);
  }

  onPostClick() {
    this.router.navigate(['/post', this.post.id]);
    this.postClick.emit(this.post);
  }
}
