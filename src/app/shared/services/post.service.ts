import { Injectable } from '@angular/core';
import { Observable, forkJoin, from, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Post, PostCategory, PostInteraction, PostStats } from '../models/Post';
import PocketBase from 'pocketbase';
import { environment } from '../../../../environments/environment';
import { User } from '../models/User';
import { Comments } from '../models/Comment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private pb: PocketBase;
  private usersCache: Map<string, User> = new Map();

  constructor(private http: HttpClient) {
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
        avatarUrl: userRecord['avatarUrl'] || 'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
        isVerified: userRecord['isVerified'] || false,
        isOfficialAccount: userRecord['isOfficialAccount'] || false,
      })),
      tap((user) => this.usersCache.set(userId, user)),
      catchError(() => {
        const defaultUser: User = {
          id: userId,
          name: 'Autor Desconhecido',
          username: 'desconhecido',
          avatarUrl: 'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
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
        shares: expand.stats.shares || 0,
        timeAgo: this.calculateTimeAgo(publishedAt),
      };
    } else {
      stats = {
        id: record.stats || 'default-stats',
        views: 0,
        likes: 0,
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
            avatarUrl: 'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
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
            avatarUrl: 'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
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

  getCommentsByPostId(
    postId: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<{ comments: Comments[]; total: number }> {
    return from(
      this.pb.collection('comments').getList(page, perPage, {
        filter: `postId = '${postId}'`,
        sort: '-createdAt',
        expand: 'author,stats',
        fields: 'id,content,createdAt,expand.author,expand.stats,repliesId',
      })
    ).pipe(
      map((response) => ({
        comments: response.items.map((item) => this.mapToComment(item)),
        total: response.totalItems,
      })),
      catchError((error) => {
        console.error('Error fetching comments:', error);
        return of({ comments: [], total: 0 });
      })
    );
  }

  private mapToComment(record: any): Comments {
    return {
      id: record.id,
      postId: record.postId,
      content: record.content,
      repliesId: record.repliesId,
      author: record.expand?.author
        ? {
            id: record.expand.author.id,
            name: record.expand.author.name || 'Autor Desconhecido',
            username: record.expand.author.username || 'desconhecido',
            avatarUrl:
              record.expand.author.avatarUrl ||
              'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
            isVerified: record.expand.author.isVerified || false,
          }
        : undefined,
      createdAt: new Date(record.createdAt),
      stats: record.expand?.stats
        ? {
            id: record.expand.stats.id,
            views: record.expand.stats.views || 0,
            likes: record.expand.stats.likes || 0,
          }
        : undefined,
    };
  }

  createComment(
    postId: string,
    content: string,
    authorId?: string,
    parentCommentId?: string
  ): Observable<Comments> {
    const data: any = { postId, content, author: authorId };
    if (parentCommentId) {
      data.parentCommentId = parentCommentId;
    }

    return from(
      this.pb.collection('comments').create(data, { expand: 'author,stats' })
    ).pipe(
      map((record: any) => this.mapToComment(record)),
      catchError((error) => {
        console.error('Error creating comment:', error);
        throw error;
      })
    );
  }

  getRepliesByCommentId(
    commentId: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<{ comments: Comments[]; total: number }> {
    return from(
      this.pb.collection('comments').getList(page, perPage, {
        filter: `parentCommentId = '${commentId}'`,
        sort: 'createdAt',
        expand: 'author,stats',
        fields: 'id,content,createdAt,expand.author,expand.stats',
      })
    ).pipe(
      map((response) => ({
        comments: response.items.map((item) => this.mapToComment(item)),
        total: response.totalItems,
      })),
      catchError((error) => {
        console.error('Error fetching comment replies:', error);
        return of({ comments: [], total: 0 });
      })
    );
  }

  getCommentReplies(commentId: string): Observable<Comments[]> {
    return from(
      this.pb.collection('comments').getList(1, 100, {
        filter: `repliesId = '${commentId}'`,
        sort: 'createdAt',
        expand: 'author,stats',
        fields: 'id,content,createdAt,expand.author,expand.stats',
      })
    ).pipe(
      map((response) => response.items.map((item) => this.mapToComment(item))),
      catchError((error) => {
        console.error('Erro ao buscar respostas do comentário:', error);
        return of([]);
      })
    );
  }

  createCommentReply(
    commentId: string,
    content: string,
    postId: string,
    authorId?: string
  ): Observable<Comments> {
    const data: any = {
      content,
      postId,
      repliesId: commentId,
      author: authorId,
    };

    return from(
      this.pb.collection('comments').create(data, { expand: 'author,stats' })
    ).pipe(
      map((record: any) => this.mapToComment(record)),
      catchError((error) => {
        console.error('Erro ao criar resposta do comentário:', error);
        throw error;
      })
    );
  }
}
