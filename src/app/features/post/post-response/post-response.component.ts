import { Component, Input } from '@angular/core';
import { Post } from '../../../shared/models/Post';
import { Comments } from '../../../shared/models/Comment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-response.component',
  imports: [FormsModule],
  templateUrl: './post-response.component.html',
})
export class PostResponseComponent {
  @Input() post!: Post;
  newComment = '';
  isSubmitting = false;
  comments: Comments[] = [];

  submitComment() {
    if (!this.newComment.trim() || this.isSubmitting) return;

    this.isSubmitting = true;

    setTimeout(() => {
      const newComment: Comments = {
        id: (this.comments.length + 1).toString(),
        postId: this.post.id,
        content: this.newComment.trim(),
        author: {
          id: 'current_user',
          name: 'Você',
          username: 'voce',
          avatarUrl: 'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
        },
        createdAt: new Date(),
        stats: {
          id: (this.comments.length + 1).toString(),
          likes: 0,
          shares: 0,
        },
      };

      this.comments.unshift(newComment);
      this.newComment = '';
      this.isSubmitting = false;
    }, 1000);
  }
}
