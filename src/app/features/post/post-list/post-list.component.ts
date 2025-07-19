import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post, PostInteraction } from '../../../shared/models/Post';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './post-list.component.html',
  styles: []
})
export class PostListComponent {
  @Input() posts: Post[] = [];
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() hasMore = true;
  
  @Output() postInteraction = new EventEmitter<PostInteraction>();
  @Output() postClick = new EventEmitter<Post>();
  @Output() loadMore = new EventEmitter<void>();

  trackByPostId(index: number, post: Post): string {
    return post.id;
  }

  onPostInteraction(interaction: PostInteraction) {
    this.postInteraction.emit(interaction);
  }

  onPostClick(post: Post) {
    this.postClick.emit(post);
  }

  onLoadMore() {
    this.loadMore.emit();
  }
}

