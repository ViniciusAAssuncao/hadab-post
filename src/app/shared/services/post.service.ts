import { Injectable } from '@angular/core';
import { Observable, forkJoin, from, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Post, PostCategory, PostInteraction, PostStats } from '../models/Post';
import PocketBase from 'pocketbase';
import { environment } from '../../../../environments/environment';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private pb: PocketBase;
  private usersCache: Map<string, User> = new Map();

  constructor() {
    this.pb = new PocketBase(environment.pocketbaseUrl);
  }

  private getUserById(userId: string): Observable<User> {
    if (this.usersCache.has(userId)) {
      return of(this.usersCache.get(userId)!);
    }

    return from(this.pb.collection('users').getOne(userId)).pipe(
      map((userRecord) => ({
        id: userRecord.id,
        name: userRecord['name'] || 'Autor Desconhecido',
        username: userRecord['username'] || 'desconhecido',
        avatarUrl: userRecord['avatarUrl'] || 'assets/default-avatar.png',
        isVerified: userRecord['isVerified'] || false,
      })),
      tap((user) => this.usersCache.set(userId, user)),
      catchError(() => {
        const defaultUser: User = {
          id: userId,
          name: 'Autor Desconhecido',
          username: 'desconhecido',
          avatarUrl: 'assets/default-avatar.png',
          isVerified: false,
        };
        this.usersCache.set(userId, defaultUser);
        return of(defaultUser);
      })
    );
  }

  getPosts(
    page: number = 1,
    perPage: number = 30
  ): Observable<{ posts: Post[]; totalPages: number; totalItems: number }> {
    return from(
      this.pb.collection('posts').getList(page, perPage, {
        sort: '-publishedAt,-created',
        expand: 'category,stats',
        fields: '*,expand.category.*,expand.stats.*',
      })
    ).pipe(
      switchMap((response) => {
        const postsWithAuthors$ = response.items.map((item) =>
          this.enrichPostWithAuthor(item)
        );

        return forkJoin(postsWithAuthors$).pipe(
          map((posts) => ({
            posts,
            totalPages: response.totalPages,
            totalItems: response.totalItems,
          }))
        );
      }),
      catchError((error) => {
        console.error('Error fetching posts:', error);
        return of({ posts: [], totalPages: 0, totalItems: 0 });
      })
    );
  }

  private enrichPostWithAuthor(record: any): Observable<Post> {
    return this.getUserById(record.author).pipe(
      map((author) => this.mapToPost(record, author))
    );
  }

  private mapToPost(record: any, author: User): Post {
    const expand = record.expand || {};
    const publishedAt =
      record.publishedAt && record.publishedAt !== ''
        ? new Date(record.publishedAt)
        : new Date(record.created || new Date());

    let category: PostCategory;
    if (expand.category) {
      category = {
        id: expand.category.id,
        name: expand.category.name || '',
        slug: expand.category.slug || '',
        color: expand.category.color || '#ffffff',
        backgroundColor: expand.category.backgroundColor || '#999999',
      };
    } else {
      category = {
        id: record.category || 'default-category',
        name: '',
        slug: '',
        color: '#ffffff',
        backgroundColor: '#999999',
      };
    }

    let stats: PostStats;
    if (expand.stats) {
      stats = {
        id: expand.stats.id,
        views: expand.stats.views || 0,
        likes: expand.stats.likes || 0,
        comments: expand.stats.comments || 0,
        shares: expand.stats.shares || 0,
        timeAgo: this.calculateTimeAgo(publishedAt),
      };
    } else {
      stats = {
        id: record.stats || 'default-stats',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        timeAgo: this.calculateTimeAgo(publishedAt),
      };
    }

    return {
      id: record.id,
      title: record.title || '',
      content: record.content || '',
      category,
      author,
      publishedAt,
      stats,
      imageUrl: record.imageUrl || '',
      tags: Array.isArray(record.tags) ? record.tags : [],
      isPromoted: record.isPromoted || false,
    };
  }

  getPostById(id: string): Observable<Post | undefined> {
    return from(
      this.pb.collection('posts').getOne(id, {
        expand: 'category,stats',
        fields: '*,expand.category.*,expand.stats.*',
      })
    ).pipe(
      switchMap((record) => this.enrichPostWithAuthor(record)),
      catchError((error) => {
        console.error(`Error fetching post ${id}:`, error);
        return of(undefined);
      })
    );
  }

  getPostsByCategory(
    categorySlug: string,
    page: number = 1,
    perPage: number = 30
  ): Observable<{ posts: Post[]; totalPages: number; totalItems: number }> {
    return from(
      this.pb.collection('posts').getList(page, perPage, {
        filter: `category.slug = '${categorySlug}'`,
        sort: '-publishedAt,-created',
        expand: 'category,stats',
        fields: '*,expand.category.*,expand.stats.*',
      })
    ).pipe(
      switchMap((response) => {
        const postsWithAuthors$ = response.items.map((item) =>
          this.enrichPostWithAuthor(item)
        );
        return forkJoin(postsWithAuthors$).pipe(
          map((posts) => ({
            posts,
            totalPages: response.totalPages,
            totalItems: response.totalItems,
          }))
        );
      }),
      catchError((error) => {
        console.error(
          `Error fetching posts for category ${categorySlug}:`,
          error
        );
        return of({ posts: [], totalPages: 0, totalItems: 0 });
      })
    );
  }

  handlePostInteraction(interaction: PostInteraction): Observable<boolean> {
    return this.getPostById(interaction.id).pipe(
      switchMap((post) => {
        if (!post || !post.stats?.id) return of(false);

        const statsId = post.stats.id;
        const updateData: any = {};

        switch (interaction.type) {
          case 'like':
            updateData.likes = (post.stats.likes || 0) + 1;
            break;
          case 'comment':
            updateData.comments = (post.stats.comments || 0) + 1;
            break;
          case 'share':
            updateData.shares = (post.stats.shares || 0) + 1;
            break;
        }

        return from(
          this.pb.collection('stats').update(statsId, updateData)
        ).pipe(
          map(() => true),
          catchError((error) => {
            console.error(
              `Error updating ${interaction.type} for post ${interaction.id}:`,
              error
            );
            return of(false);
          })
        );
      })
    );
  }

  searchPosts(
    query: string,
    page: number = 1,
    perPage: number = 30
  ): Observable<{ posts: Post[]; totalPages: number; totalItems: number }> {
    return from(
      this.pb.collection('posts').getList(page, perPage, {
        filter: `(title ~ '${query}' || content ~ '${query}' || tags ? '%${query}%')`,
        sort: '-publishedAt,-created',
        expand: 'category,stats',
        fields: '*,expand.category.*,expand.stats.*',
      })
    ).pipe(
      switchMap((response) => {
        const postsWithAuthors$ = response.items.map((item) =>
          this.enrichPostWithAuthor(item)
        );
        return forkJoin(postsWithAuthors$).pipe(
          map((posts) => ({
            posts,
            totalPages: response.totalPages,
            totalItems: response.totalItems,
          }))
        );
      }),
      catchError((error) => {
        console.error(`Error searching posts for "${query}":`, error);
        return of({ posts: [], totalPages: 0, totalItems: 0 });
      })
    );
  }

  createPost(postData: Partial<Post>): Observable<Post> {
    return from(
      this.pb.collection('posts').create({
        title: postData.title,
        content: postData.content,
        category: postData.category?.id,
        author: postData.author?.id,
        publishedAt: postData.publishedAt?.toISOString(),
        stats: postData.stats?.id,
        imageUrl: postData.imageUrl,
        tags: postData.tags,
        isPromoted: postData.isPromoted,
      })
    ).pipe(
      map((item) =>
        this.mapToPost(
          item,
          postData.author || {
            id: '',
            name: 'Autor Desconhecido',
            username: 'desconhecido',
            avatarUrl: 'assets/default-avatar.png',
            isVerified: false,
          }
        )
      ),
      catchError((error) => {
        console.error('Error creating post:', error);
        throw error;
      })
    );
  }

  updatePost(id: string, postData: Partial<Post>): Observable<Post> {
    return from(
      this.pb.collection('posts').update(id, {
        title: postData.title,
        content: postData.content,
        category: postData.category?.id,
        author: postData.author?.id,
        publishedAt: postData.publishedAt?.toISOString(),
        stats: postData.stats?.id,
        imageUrl: postData.imageUrl,
        tags: postData.tags,
        isPromoted: postData.isPromoted,
      })
    ).pipe(
      map((item) =>
        this.mapToPost(
          item,
          postData.author || {
            id: '',
            name: 'Autor Desconhecido',
            username: 'desconhecido',
            avatarUrl: 'assets/default-avatar.png',
            isVerified: false,
          }
        )
      ),
      catchError((error) => {
        console.error(`Error updating post ${id}:`, error);
        throw error;
      })
    );
  }

  deletePost(id: string): Observable<boolean> {
    return from(this.pb.collection('posts').delete(id)).pipe(
      map(() => true),
      catchError((error) => {
        console.error(`Error deleting post ${id}:`, error);
        return of(false);
      })
    );
  }

  private calculateTimeAgo(date: Date): string {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'agora há pouco';
    if (diffSeconds < 3600) return `há ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `há ${Math.floor(diffSeconds / 3600)} h`;

    const diffDays = Math.floor(diffSeconds / 86400);
    if (diffDays < 30) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12)
      return `há ${diffMonths} mês${diffMonths > 1 ? 'es' : ''}`;

    return `há ${Math.floor(diffMonths / 12)} ano${
      Math.floor(diffMonths / 12) > 1 ? 's' : ''
    }`;
  }
}
