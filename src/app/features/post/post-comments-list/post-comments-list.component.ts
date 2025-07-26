import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NestedComment } from '../../../shared/models/Comment';
import { LucideAngularModule, MessageSquare } from 'lucide-angular';
import { PostCommentCardComponent } from '../post-comment-card/post-comment-card.component';
import { Post } from '../../../shared/models/Post';

@Component({
  selector: 'app-post-comments-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PostCommentCardComponent],
  templateUrl: './post-comments-list.component.html',
})
export class PostCommentsListComponent {
  readonly MessageSquareIcon = MessageSquare;
  @Input() comments: NestedComment[] = [];
  @Input() canLoadMore = false;
  @Input() post!: Post;
  @Output() loadMore = new EventEmitter<void>();

  trackByCommentId(index: number, comment: NestedComment): string {
    return comment.id;
  }
}
