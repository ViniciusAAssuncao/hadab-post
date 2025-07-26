import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  MessageCircle,
  Heart,
  Eye,
  MoreHorizontal,
  Repeat2,
  Share,
  Bot,
} from 'lucide-angular';
import { Post, PostInteraction } from '../../../shared/models/Post';
import { finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { Comments, NestedComment } from '../../../shared/models/Comment';
import { PostService } from '../../../shared/services/post.service';
import { PostModule } from '../post.module';
import { PostCommentsListComponent } from '../post-comments-list/post-comments-list.component';
import { Nl2brPipe } from '../../../shared/pipes/nl2br.pipe';
import { AiCommentGeneratorService } from '../../../shared/services/ai-comment-generator.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    PostModule,
    PostCommentsListComponent,
    Nl2brPipe,
  ],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  post: Post | null = null;
  comments: Comments[] = [];
  nestedComments: NestedComment[] = [];
  newComment = '';
  isSubmitting = false;
  isLoading = true;
  postNotFound = false;
  isGeneratingComment = false;

  commentMap = new Map<string, NestedComment>();

  currentCommentPage = 1;
  totalComments = 0;
  commentsPerPage = 10;

  readonly ArrowLeftIcon = ArrowLeft;
  readonly MessageCircleIcon = MessageCircle;
  readonly HeartIcon = Heart;
  readonly Repeat2Icon = Repeat2;
  readonly ShareIcon = Share;
  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly EyeIcon = Eye;
  readonly BotIcon = Bot;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private cdr: ChangeDetectorRef,
    private aiCommentService: AiCommentGeneratorService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params) => {
          const postId = params['id'];
          if (postId) {
            this.isLoading = true;
            return this.postService.getPostById(postId);
          }
          this.postNotFound = true;
          this.isLoading = false;
          return [];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (postData) => {
          if (postData) {
            this.post = postData;
            this.loadComments(postData.id);
          } else {
            this.postNotFound = true;
          }
          this.isLoading = false;
        },
        error: () => {
          this.postNotFound = true;
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get commentCount(): number {
    return this.totalComments ?? this.comments.length;
  }

  private loadComments(postId: string) {
    this.postService
      .getCommentsByPostId(
        postId,
        this.currentCommentPage,
        this.commentsPerPage
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ comments, total }) => {
          this.comments = comments;
          this.totalComments = total;
          this.nestedComments = this.buildCommentTree(this.comments);
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load comments:', error);
          this.comments = [];
        },
      });
  }

  loadMoreComments() {
    if (this.post && this.comments.length < this.totalComments) {
      this.currentCommentPage++;
      this.postService
        .getCommentsByPostId(
          this.post.id,
          this.currentCommentPage,
          this.commentsPerPage
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ({ comments }) => {
            this.comments = [...this.comments, ...comments];
            this.nestedComments = this.buildCommentTree(this.comments);
            this.cdr.markForCheck();
          },
        });
    }
  }

  private buildCommentTree(comments: Comments[]): NestedComment[] {
    const commentMap = new Map<string, NestedComment>();

    const rootComments: NestedComment[] = [];

    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    commentMap.forEach((nestedComment) => {
      if (nestedComment.repliesId) {
        const parent = commentMap.get(nestedComment.repliesId as string);
        if (parent) {
          parent.replies.push(nestedComment);
        }
      } else {
        rootComments.push(nestedComment);
      }
    });

    const sortByDate = (a: NestedComment, b: NestedComment) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    rootComments.sort(sortByDate);
    rootComments.forEach((comment) => {
      if (comment.replies.length > 1) {
        comment.replies.sort(sortByDate);
      }
    });

    return rootComments;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }

  onInteraction(interaction: PostInteraction) {
    console.log('Post interaction:', interaction);
  }

  toggleCommentLike(comment: Comments) {
    console.log('Toggling like for comment:', comment.id);
  }

  trackByCommentId(index: number, comment: Comments): string {
    return comment.id;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(date));
  }

  generateAiComment() {
    if (!this.post || this.isGeneratingComment) {
      return;
    }

    this.isGeneratingComment = true;

    this.aiCommentService
      .generateReply(this.post, [])
      .pipe(
        switchMap((commentText: string) => {
          return this.postService.createComment(this.post!.id, commentText);
        }),
        takeUntil(this.destroy$),
        finalize(() => {
          this.isGeneratingComment = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (newComment: Comments) => {
          this.comments.unshift(newComment);
          this.totalComments++;
        },
        error: (error: any) => {
          console.error(
            'Falha no processo de criação de comentário por IA:',
            error
          );
        },
      });
  }
}
