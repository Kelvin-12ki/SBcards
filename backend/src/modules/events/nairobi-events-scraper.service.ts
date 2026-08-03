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
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly BASE_URL = 'https://nairobieventsguide.com';

  async getUpcomingEvents(): Promise<NairobiEvent[]> {
    if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
      this.logger.log('Returning cached Nairobi Events Guide results');
      return this.cache;
    }

    try {
      this.logger.log('Fetching events from llms.txt...');
      const { data: text } = await axios.get(`${this.BASE_URL}/llms.txt`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
        responseType: 'text',
      });

      const events = this.parseLlmsTxt(text);
      this.logger.log(`Parsed ${events.length} events from llms.txt`);

      // Fetch details (date, venue, image) for top 25 events
      const detailedEvents = await this.fetchEventDetails(events.slice(0, 25));
      const remaining = events.slice(25).map((e) => ({
        ...e,
        dateString: 'Date TBA',
        parsedDate: null,
        venue: '',
        imageUrl: '',
      }));

      const allEvents = [...detailedEvents, ...remaining];
      this.cache = allEvents;
      this.cacheTime = Date.now();
      return allEvents;
    } catch (error) {
      this.logger.error(
        `Failed to fetch events: ${(error as Error).message}`,
      );
      if (this.cache) return this.cache;
      return [];
    }
  }

  private parseLlmsTxt(text: string): NairobiEvent[] {
    const events: NairobiEvent[] = [];
    const lines = text.split('\n');

    // Find the "## Events" section
    let inEventsSection = false;
    for (const line of lines) {
      if (line.trim() === '## Events') {
        inEventsSection = true;
        continue;
      }
      if (inEventsSection && line.startsWith('## ') && !line.startsWith('## Events')) {
        break; // next section
      }
      if (!inEventsSection) continue;

      // Parse: - [Title](URL): Description
      const match = line.match(/^-\s*\[(.+?)\]\((.+?)\):\s*(.*)/);
      if (!match) continue;

      const [, title, url, description] = match;
      const eventUrl = url.startsWith('http') ? url : `${this.BASE_URL}${url}`;

      events.push({
        title: title.replace(/&#038;/g, '&').replace(/&amp;/g, '&'),
        imageUrl: '',
        venue: '',
        dateString: 'Date TBA',
        parsedDate: null,
        description: (description || '').replace(/&#038;/g, '&').replace(/&amp;/g, '&').slice(0, 300),
        eventUrl,
        source: 'nairobieventsguide.com',
      });
    }

    return events;
  }

  private async fetchEventDetails(
    events: NairobiEvent[],
  ): Promise<NairobiEvent[]> {
    const results = await Promise.allSettled(
      events.map(async (event) => {
        try {
          const { data: html } = await axios.get(event.eventUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'text/html',
            },
            timeout: 10000,
            responseType: 'text',
          });

          // Extract date from meta tags or content
          const ogImage =
            html.match(
              /<meta\s+property="og:image"\s+content="([^"]+)"/,
            )?.[1] || '';

          // Look for date patterns in the page
          const datePatterns = [
            // EventPrime format: "Sat, August 1, 2026"
            /(\w{3},?\s+\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i,
            // "August 7, 2026" or "August 7, 2026 06:00 PM"
            /(\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i,
            // "07 August 2026"
            /(\d{1,2}\s+\w+\s+\d{4})/i,
            // Schema.org datePublished or startDate
            /"startDate"\s*:\s*"([^"]+)"/,
            /"date"\s*:\s*"([^"]+)"/,
          ];

          let dateString = 'Date TBA';
          for (const pattern of datePatterns) {
            const match = html.match(pattern);
            if (match) {
              dateString = match[1];
              break;
            }
          }

          // Try to extract venue from structured data or content
          const venueMatch =
            html.match(/"location"\s*:\s*"([^"]+)"/) ||
            html.match(/"venue"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
          const venue = venueMatch?.[1] || '';

          return {
            ...event,
            imageUrl: ogImage,
            venue,
            dateString,
            parsedDate: this.parseDate(dateString),
          };
        } catch {
          return event;
        }
      }),
    );

    return results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : events[i],
    );
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
