import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { PostCardComponent } from './post-card/post-card.component';
import { PostListComponent } from './post-list/post-list.component';
import { PostFeedComponent } from './post-feed/post-feed.component';
import { PostCategoryComponent } from './post-category/post-category.component';
import { PostStatsComponent } from './post-stats/post-stats.component';
import { PostAuthorComponent } from './post-author/post-author.component';

import { PostService } from '../../shared/services/post.service';

@NgModule({
  imports: [
    CommonModule,
    LucideAngularModule,
    PostCardComponent,
    PostListComponent,
    PostFeedComponent,
    PostCategoryComponent,
    PostStatsComponent,
    PostAuthorComponent,
  ],
  exports: [
    PostCardComponent,
    PostListComponent,
    PostFeedComponent,
    PostCategoryComponent,
    PostStatsComponent,
    PostAuthorComponent,
  ],
})
export class PostModule {}

export {
  PostCardComponent,
  PostListComponent,
  PostFeedComponent,
  PostCategoryComponent,
  PostStatsComponent,
  PostAuthorComponent,
  PostService,
};
