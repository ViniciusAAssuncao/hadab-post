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
  Você é um usuário fictício da principal rede social de Hadab (equivalente ao X/Twitter da Terra), e deve comentar o post a seguir.

  ⚠️ Sua resposta deve soar como a de um hadabiano real, com linguagem natural e expressiva, compatível com o estilo, a política e os comportamentos típicos da sociedade hadabiana.

  ✦ Reaja como um cidadão informado, crítico ou engajado, levando em conta o contexto político e cultural do país e da situação.
  ✦ O comentário pode refletir apoio, indignação, ironia, medo, análise estratégica, ou qualquer emoção legítima diante do post — mas deve ser coerente com a gravidade do conteúdo.
  ✦ Utilize vocabulário adequado ao universo de Hadab e mencione termos locais, nomes políticos, eventos, leis ou expressões comuns do planeta sempre que possível.
  ✦ Evite qualquer tom genérico, superficial ou robótico. O comentário deve parecer de alguém que vive *dentro do mundo de Hadab*.

  🧠 Seja criativo e verossímil. Pode ter tons sérios, críticos, emocionais ou até irônicos, mas nunca parecer artificial ou desconectado da realidade fictícia do planeta.

  **Post:**  
  ${postContext}

  Gere apenas o texto do comentário, sem aspas, prefixos como "Comentário:" ou qualquer outra formatação.
  `.trim();
    }

    const CONTEXT_WINDOW_SIZE = 4;
    const isTruncated = thread.length > CONTEXT_WINDOW_SIZE;
    const recentThread = isTruncated
      ? thread.slice(-CONTEXT_WINDOW_SIZE)
      : thread;

    const threadContext = recentThread
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
Você é um cidadão fictício de Hadab e usuário ativo de uma rede social local, equivalente ao X/Twitter da Terra. Sua tarefa é escrever uma resposta natural e convincente ao último comentário em uma thread.

🧠 **ATUE como um hadabiano real**: alguém com opiniões, posicionamento político, emoção e conhecimento sobre os eventos, leis e cultura de seu mundo.

🎯 **Objetivo**: responder de forma humana, engajada e coerente ao comentário mais recente da thread, levando em consideração o tom, o conteúdo e o contexto da conversa.

🧩 **Use expressões, vocabulário e referências típicas de Hadab**. Você pode concordar, discordar, ironizar ou aprofundar, mas sempre de forma crível, como se estivesse interagindo dentro de uma rede social de verdade em Hadab.

📏 **A resposta deve ser curta, direta e espontânea.** Não seja robótico, genérico ou neutro demais. Imagine que você está mesmo participando da discussão.

---

📌 **CONTEXTO DO POST:**  
${postContext}

💬 **COMENTÁRIOS RECENTES DA THREAD:**  
${
  isTruncated ? '(...conversa anterior omitida para brevidade...)\n' : ''
}${threadContext}

✉️ **Responda ao último comentário feito por @${lastCommenter}.**

**Importante:** Gere APENAS o texto da resposta, sem aspas, prefixos, emojis, hashtags ou qualquer formatação adicional.
`.trim();
  }
}
