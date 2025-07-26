import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comments, NestedComment } from '../../../shared/models/Comment';
import { Post } from '../../../shared/models/Post';
import { LucideAngularModule, Wand2, MessageCircle } from 'lucide-angular';
import { AiCommentGeneratorService } from '../../../shared/services/ai-comment-generator.service';
import { finalize, switchMap } from 'rxjs';
import { PostService } from '../../../shared/services/post.service';
import { Nl2brPipe } from '../../../shared/pipes/nl2br.pipe';

@Component({
  selector: 'app-post-comment-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    PostCommentCardComponent,
    Nl2brPipe,
  ],
  templateUrl: './post-comment-card.component.html',
})
export class PostCommentCardComponent implements OnInit {
  @Input() post!: Post;
  @Input() comment!: NestedComment;
  @Input() isLast: boolean = false;
  @Input() isReply: boolean = false;
  @Input() postId: string = '';
  @Input() parentThread: Comments[] = [];
  @Input() depth: number = 0;
  @Input() isParentExpanded = false;

  private readonly MAX_DEPTH = 2;
  private readonly REPLIES_PAGE_SIZE = 2;

  childThread: Comments[] = [];
  readonly WandIcon = Wand2;
  readonly MessageCircleIcon = MessageCircle;

  private cdr = inject(ChangeDetectorRef);
  private aiCommentGenerator = inject(AiCommentGeneratorService);
  private postService = inject(PostService);

  visibleReplies: NestedComment[] = [];
  canLoadMoreReplies = false;
  repliesLeftCount = 0;
  isGeneratingAiReply = false;
  isThreadExpanded = false;

  ngOnInit(): void {
    this.childThread = [...this.parentThread, this.comment];

    if (this.comment?.replies) {
      if (this.isExpanded) {
        this.visibleReplies = [...this.comment.replies];
      } else {
        this.visibleReplies = this.comment.replies.slice(
          0,
          this.REPLIES_PAGE_SIZE
        );
      }
      this.updateRepliesPagination();
    }
  }

  get isExpanded(): boolean {
    return this.isThreadExpanded || this.isParentExpanded;
  }

  get shouldDisplayReplies(): boolean {
    return this.depth < this.MAX_DEPTH || this.isExpanded;
  }

  generateAiReply(): void {
    if (!this.post?.id) return;
    this.isGeneratingAiReply = true;

    this.aiCommentGenerator
      .generateReply(this.post, this.childThread)
      .pipe(
        switchMap((replyText: string) =>
          this.postService.createCommentReply(
            this.comment.id,
            replyText,
            this.post.id
          )
        ),
        finalize(() => {
          this.isGeneratingAiReply = false;
        })
      )
      .subscribe({
        next: (newReply: Comments) => {
          const newNestedReply: NestedComment = { ...newReply, replies: [] };
          this.comment.replies.unshift(newNestedReply);
          this.visibleReplies.unshift(newNestedReply);
          this.updateRepliesPagination();
        },
        error: (error) =>
          console.error('Erro ao gerar resposta com IA:', error),
      });
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(date));
  }

  loadMoreReplies(): void {
    if (!this.comment?.replies) return;

    const currentVisibleCount = this.visibleReplies.length;
    const nextReplies = this.comment.replies.slice(
      currentVisibleCount,
      currentVisibleCount + this.REPLIES_PAGE_SIZE
    );
    this.visibleReplies = [...this.visibleReplies, ...nextReplies];
    this.updateRepliesPagination();
  }

  private updateRepliesPagination(): void {
    if (!this.comment?.replies) return;

    const totalReplies = this.comment.replies.length;
    const visibleCount = this.visibleReplies.length;

    this.canLoadMoreReplies = totalReplies > visibleCount;
    this.repliesLeftCount = totalReplies - visibleCount;
    this.cdr.markForCheck();
  }

  expandThread(): void {
    if (!this.comment?.replies) return;
    this.isThreadExpanded = true;
    this.visibleReplies = [...this.comment.replies];
    this.updateRepliesPagination();
  }

  trackByCommentId(index: number, comment: Comments): string {
    return comment.id;
  }
}
