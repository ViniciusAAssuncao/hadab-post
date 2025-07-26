import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PostService } from '../../../shared/services/post.service';
import { PostListComponent } from '../post-list/post-list.component';
import { Post, PostInteraction } from '../../../shared/models/Post';

@Component({
  selector: 'app-post-feed',
  standalone: true,
  imports: [CommonModule, PostListComponent],
  templateUrl: './post-feed.component.html',
  styles: [],
})
export class PostFeedComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  loading = true;
  loadingMore = false;
  hasMore = true;

  private destroy$ = new Subject<void>();

  constructor(
    private postService: PostService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPosts() {
    this.loading = true;
    this.postService.getPosts().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (posts) => {
        this.posts = posts.posts;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erro ao carregar posts:', error);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadMorePosts() {
    if (this.loadingMore || !this.hasMore) return;

    this.loadingMore = true;
    setTimeout(() => {
      this.loadingMore = false;
      this.hasMore = false;
      this.cdr.markForCheck();
    }, 1000);
  }

  handlePostInteraction(interaction: PostInteraction) {
    this.postService
      .handlePostInteraction(interaction)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            console.log('Interação processada:', interaction);
          }
        },
        error: (error) => {
          console.error('Erro ao processar interação:', error);
        },
      });
  }
}