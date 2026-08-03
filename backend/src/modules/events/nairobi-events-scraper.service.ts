import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface NairobiEvent {
  title: string;
  imageUrl: string;
  venue: string;
  dateString: string;
  parsedDate: string | null;
  description: string;
  eventUrl: string;
  source: string;
}

@Injectable()
export class NairobiEventsScraperService {
  private readonly logger = new Logger(NairobiEventsScraperService.name);
  private cache: NairobiEvent[] | null = null;
  private cacheTime = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly BASE_URL = 'https://nairobieventsguide.com';

  async getUpcomingEvents(): Promise<NairobiEvent[]> {
    if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
      this.logger.log('Returning cached Nairobi Events Guide results');
      return this.cache;
    }

    try {
      this.logger.log('Fetching upcoming events page...');
      const { data: html } = await axios.get<string>(
        `${this.BASE_URL}/upcoming-events/`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 20000,
          responseType: 'text',
          maxContentLength: 5 * 1024 * 1024, // 5MB limit
        },
      );

      const events = this.parseHtml(html);
      this.logger.log(`Parsed ${events.length} events from HTML`);

      this.cache = events;
      this.cacheTime = Date.now();
      return events;
    } catch (error) {
      this.logger.error(
        `Failed to fetch events: ${(error as Error).message}`,
      );
      if (this.cache) return this.cache;
      return [];
    }
  }

  private parseHtml(html: string): NairobiEvent[] {
    const events: NairobiEvent[] = [];

    // Split into card blocks using the card container pattern
    const cardBlocks = html.split(/ep-box-card-item\s+ep-border/);

    for (let i = 1; i < cardBlocks.length; i++) {
      const block = cardBlocks[i];
      // Each card is ~11K chars; content is near the end (title at ~8K)
      const chunk = block.substring(0, 15000);

      try {
        // Title + URL from ep-box-card-title
        const titleMatch = chunk.match(
          /ep-box-card-title[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/,
        );
        if (!titleMatch) continue;

        const eventUrl = titleMatch[1].trim();
        const title = titleMatch[2].replace(/\s+/g, ' ').trim();
        if (!title) continue;

        // Venue from ep-box-card-venue
        const venueMatch = chunk.match(
          /ep-box-card-venue[^>]*>\s*([\s\S]*?)\s*<\/div>/,
        );
        const venue = venueMatch
          ? venueMatch[1].replace(/\s+/g, ' ').trim()
          : '';

        // Date from ep-card-event-date-start
        const dateMatch = chunk.match(
          /ep-card-event-date-start[^>]*>\s*([\s\S]*?)\s*<\/span>/,
        );
        const dateString = dateMatch
          ? dateMatch[1].replace(/\s+/g, ' ').trim()
          : 'Date TBA';

        // Image from the first picture/source or img tag
        const imageMatch = chunk.match(
          /ep-img-link[\s\S]*?<picture>[\s\S]*?srcset="([^"]+)"/,
        );
        let imageUrl = '';
        if (imageMatch) {
          // Get the largest image from srcset
          const srcset = imageMatch[1];
          const sources = srcset.split(',').map((s) => s.trim());
          // Pick the first (largest) source
          const largest = sources[0]?.split(' ')[0];
          if (largest) imageUrl = largest;
        }
        // Fallback to img src
        if (!imageUrl) {
          const imgMatch = chunk.match(
            /ep-img-link[\s\S]*?<img[^>]+src="([^"]+)"/,
          );
          if (imgMatch) imageUrl = imgMatch[1];
        }

        // Description from ep-box-card-desc
        const descMatch = chunk.match(
          /ep-box-card-desc-masonry[^>]*>\s*([\s\S]*?)\s*<\/div>/,
        );
        const description = descMatch
          ? descMatch[1]
              .replace(/<[^>]+>/g, '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 300)
          : '';

        events.push({
          title: title.replace(/&#038;/g, '&').replace(/&amp;/g, '&'),
          imageUrl,
          venue: venue.replace(/&#038;/g, '&').replace(/&amp;/g, '&'),
          dateString,
          parsedDate: this.parseDate(dateString),
          description: description
            .replace(/&#038;/g, '&')
            .replace(/&amp;/g, '&'),
          eventUrl,
          source: 'nairobieventsguide.com',
        });
      } catch {
        // Skip malformed cards
        continue;
      }
    }

    return events;
  }

  private parseDate(dateStr: string): string | null {
    if (!dateStr || dateStr === 'Date TBA') return null;
    try {
      const cleaned = dateStr
        .replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '')
        .replace(/\s*–\s*.*$/, '');
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      // ignore
    }
    return null;
  }
}
