import { Injectable } from '@angular/core';

export interface FetchedArticleData {
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentFetcherService {

  convertUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('medium.com')) {
        urlObj.hostname = 'scribe.rip';
        return urlObj.toString();
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  async fetchArticleData(url: string): Promise<FetchedArticleData> {
    const scribeUrl = this.convertUrl(url);
    // Use a CORS proxy. 'allorigins' is reliable for text content.
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(scribeUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const fullHtml = data.contents;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');
      
      // Get title from the <title> tag, which is more reliable.
      let title = doc.querySelector('title')?.innerText || 'Untitled Article';
      // Scribe.rip often adds " - by ..." or " | Scribe". Let's clean that up.
      title = title.split(' - by ')[0].split(' | Scribe')[0].trim();
      
      // Remove scripts and styles for safety and cleanliness
      doc.querySelectorAll('script, style, nav, footer, header, iframe').forEach(el => el.remove());
      
      // Attempt to locate the core content
      const article = doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('.container') || doc.body;

      return {
        title,
        content: article.innerHTML
      };
    } catch (error) {
      console.error('Fetch error:', error);
      throw new Error('Could not fetch content. URL might be protected or invalid.');
    }
  }
}