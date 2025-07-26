import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Post } from '../models/Post';
import { environment } from '../../../../environments/environment';
import { Comments } from '../models/Comment';

@Injectable({
  providedIn: 'root',
})
export class AiCommentGeneratorService {
  private readonly API_KEY = environment.api_key;
  private readonly GEMINI_API_URL = environment.geminiApiUrl;
  private readonly OPENROUTER_API_KEY = environment.open_router_api_key;
  private readonly USE_OPENROUTER_API = environment.use_open_router_api;

  constructor(private http: HttpClient) {}

  generateReply(post: Post, thread: Comments[]): Observable<string> {
    const prompt = this.buildReplyPrompt(post, thread);

    if (this.USE_OPENROUTER_API) {
      const openRouterHeaders = new HttpHeaders({
        Authorization: `Bearer ${this.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      });
      const modelId = environment.open_router_model || 'openai/gpt-4o';

      const body = {
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        top_p: 1,
      };

      return this.http
        .post<any>('https://openrouter.ai/api/v1/chat/completions', body, {
          headers: openRouterHeaders,
        })
        .pipe(
          map((response) => {
            if (response?.choices?.[0]?.message?.content) {
              return response.choices[0].message.content
                .trim()
                .replace(/^"|"$/g, '');
            }
            throw new Error(
              'Formato de resposta inesperado da API OpenRouter.'
            );
          }),
          catchError((error) => {
            console.error(
              'Erro ao gerar comentário com a API OpenRouter:',
              error
            );
            return of('Não foi possível gerar um comentário. Tente novamente.');
          })
        );
    } else {
      const urlWithKey = `${this.GEMINI_API_URL}?key=${this.API_KEY}`;
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          stopSequences: [],
        },
      };

      return this.http.post<any>(urlWithKey, requestBody).pipe(
        map((response) => {
          if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.candidates[0].content.parts[0].text
              .trim()
              .replace(/^"|"$/g, '');
          }
          throw new Error('Formato de resposta inesperado da API do Gemini.');
        }),
        catchError((error) => {
          console.error('Erro ao gerar comentário com a API do Gemini:', error);
          return of('Não foi possível gerar um comentário. Tente novamente.');
        })
      );
    }
  }

  private buildReplyPrompt(post: Post, thread: Comments[]): string {
    const postContext = `**Post Original de @${
      post.author?.username || 'desconhecido'
    }**: "${post.content}"\n`;

    if (!thread || thread.length === 0) {
      return `
      Aja como um usuário da plataforma X/Twitter. Crie um comentário para o post a seguir.
      O comentário deve ser conciso, ter um tom natural e refletir uma reação genuína (pode ser positivo, negativo, engraçado ou questionador).

      **Contexto do Post:**
      ${postContext}

      Seja criativo e evite respostas genéricas.
      Gere apenas o texto do comentário, sem aspas, prefixos como "Comentário:" ou qualquer outra formatação.
      `.trim();
    }

    const threadContext = thread
      .map(
        (comment) =>
          `- @${comment.author?.username || 'anônimo'} disse: "${
            comment.content
          }"`
      )
      .join('\n');

    const lastComment = thread[thread.length - 1];
    const lastCommenter = lastComment?.author?.username || 'anônimo';

    return `
    Aja como um usuário engajado de uma rede social similar ao X/Twitter.
    Sua tarefa é criar uma resposta para o último comentário de uma thread. A resposta deve ser coerente com todo o contexto da conversa, desde o post original até o último comentário.

    **CONTEXTO DA CONVERSA:**
    ${postContext}
    **THREAD DE COMENTÁRIOS ATÉ AGORA:**
    ${threadContext}

    **INSTRUÇÕES:**
    - Responda ao comentário de @${lastCommenter}.
    - Sua resposta deve ser curta, natural e autêntica.
    - Pode ser uma pergunta, uma concordância, uma discordância bem-humorada, ou qualquer outra reação humana.
    - **Gere APENAS o texto da resposta, sem aspas, sem prefixos como "Resposta:" e sem repetir o nome do usuário que você está respondendo.**
    `.trim();
  }
}
