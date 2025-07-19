import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Post, PostInteraction } from '../models/Post';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private mockPosts: Post[] = [
    {
      id: '1',
      title: 'Eleições 2024: Últimas pesquisas mostram cenário acirrado',
      content: 'As mais recentes pesquisas eleitorais revelam um cenário extremamente competitivo para as eleições de 2024, com margem de erro dentro dos limites estatísticos.',
      category: {
        id: 'politica',
        name: 'Política',
        slug: 'politica',
        color: '#ffffff',
        backgroundColor: '#dc2626'
      },
      author: {
        id: 'author1',
        name: 'João Silva',
        username: 'joaosilva',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        isVerified: true
      },
      publishedAt: new Date('2024-01-15T10:30:00'),
      stats: {
        views: 45300,
        likes: 1200,
        comments: 89,
        shares: 156,
        timeAgo: '2h'
      },
      imageUrl: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=300&fit=crop',
      tags: ['eleições', 'pesquisas', 'política'],
      isPromoted: true
    },
    {
      id: '2',
      title: 'Inteligência Artificial revoluciona setor de saúde',
      content: 'Novas tecnologias de IA estão transformando diagnósticos médicos e tratamentos, prometendo maior precisão e eficiência no cuidado com pacientes.',
      category: {
        id: 'tecnologia',
        name: 'Tecnologia',
        slug: 'tecnologia',
        color: '#ffffff',
        backgroundColor: '#2563eb'
      },
      author: {
        id: 'author2',
        name: 'Maria Santos',
        username: 'mariasantos',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        isVerified: false
      },
      publishedAt: new Date('2024-01-15T08:15:00'),
      stats: {
        views: 32600,
        likes: 890,
        comments: 45,
        shares: 78,
        timeAgo: '4h'
      },
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=300&fit=crop',
      tags: ['ia', 'saúde', 'tecnologia', 'medicina']
    },
    {
      id: '3',
      title: 'Copa do Mundo: Brasil se classifica para as oitavas',
      content: 'A seleção brasileira garantiu sua vaga nas oitavas de final após vitória convincente por 3x1 contra o adversário, mostrando um futebol envolvente.',
      category: {
        id: 'esportes',
        name: 'Esportes',
        slug: 'esportes',
        color: '#ffffff',
        backgroundColor: '#16a34a'
      },
      author: {
        id: 'author3',
        name: 'Carlos Oliveira',
        username: 'carlosoliveira',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        isVerified: true
      },
      publishedAt: new Date('2024-01-15T06:45:00'),
      stats: {
        views: 78600,
        likes: 2100,
        comments: 234,
        shares: 445,
        timeAgo: '1h'
      },
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=300&fit=crop',
      tags: ['copa', 'brasil', 'futebol', 'oitavas']
    },
    {
      id: '4',
      title: 'Netflix anuncia nova série original brasileira',
      content: 'A plataforma de streaming revelou detalhes sobre sua mais nova produção nacional, que promete abordar temas contemporâneos da sociedade brasileira.',
      category: {
        id: 'entretenimento',
        name: 'Entretenimento',
        slug: 'entretenimento',
        color: '#ffffff',
        backgroundColor: '#7c3aed'
      },
      author: {
        id: 'author4',
        name: 'Ana Costa',
        username: 'anacosta',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        isVerified: false
      },
      publishedAt: new Date('2024-01-15T05:20:00'),
      stats: {
        views: 15400,
        likes: 567,
        comments: 89,
        shares: 123,
        timeAgo: '3h'
      },
      imageUrl: 'https://images.unsplash.com/photo-1489599735734-79b4169c2a78?w=600&h=300&fit=crop',
      tags: ['netflix', 'série', 'brasil', 'streaming']
    }
  ];

  private postsSubject = new BehaviorSubject<Post[]>(this.mockPosts);
  public posts$ = this.postsSubject.asObservable();

  constructor() {}

  getPosts(): Observable<Post[]> {
    return this.posts$.pipe(delay(500));
  }

  getPostById(id: string): Observable<Post | undefined> {
    return this.posts$.pipe(
      map(posts => posts.find(p => p.id === id)),
      delay(300)
    );
  }

  getPostsByCategory(categorySlug: string): Observable<Post[]> {
    return this.posts$.pipe(
      map(posts => posts.filter(p => p.category.slug === categorySlug)),
      delay(500)
    );
  }

  handlePostInteraction(interaction: PostInteraction): Observable<boolean> {
    const currentPosts = this.postsSubject.getValue();
    const postIndex = currentPosts.findIndex(p => p.id === interaction.postId);

    if (postIndex > -1) {
      const postToUpdate = currentPosts[postIndex];
      const updatedPost = {
        ...postToUpdate,
        stats: { ...postToUpdate.stats }
      };

      switch (interaction.type) {
        case 'like':
          updatedPost.stats.likes += 1;
          break;
        case 'comment':
          updatedPost.stats.comments += 1;
          break;
        case 'share':
          updatedPost.stats.shares += 1;
          break;
      }

      const newPosts = [...currentPosts];
      newPosts[postIndex] = updatedPost;
      
      this.postsSubject.next(newPosts);
    }
    
    return of(true).pipe(delay(200));
  }

  searchPosts(query: string): Observable<Post[]> {
    return this.posts$.pipe(
        map(posts => posts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content?.toLowerCase().includes(query.toLowerCase()) ||
            post.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )),
        delay(500)
    );
  }
}