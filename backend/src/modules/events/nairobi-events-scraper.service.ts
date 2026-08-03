import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
    // Return cached results if still fresh
    if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
      this.logger.log('Returning cached Nairobi Events Guide results');
      return this.cache;
    }

    try {
      this.logger.log('Fetching events from nairobieventsguide.com...');
      const { data: html } = await axios.get(
        `${this.BASE_URL}/upcoming-events/`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 15000,
        },
      );

      const $ = cheerio.load(html);
      const events: NairobiEvent[] = [];

      // EventPrime plugin uses .ep-event-card for each event card
      const cards = $('.ep-event-card');
      this.logger.log(`Found ${cards.length} event cards`);

      if (cards.length === 0) {
        this.logger.warn('No event cards found, trying fallback parsing');
        return this.fallbackParse($);
      }

      cards.each((_, card) => {
        const $card = $(card);

        // Title — .ep-box-card-title
        const title = $card.find('.ep-box-card-title').text().trim();
        if (!title) return;

        // Event URL — .ep-img-link
        const relativeUrl = $card.find('.ep-img-link').attr('href') || '';
        const eventUrl = relativeUrl.startsWith('http')
          ? relativeUrl
          : `${this.BASE_URL}${relativeUrl}`;

        // Image — try <source> srcset first (webp), then <img> src
        let imageUrl = '';
        const sourceEl = $card.find('.ep-img-link picture source').first();
        if (sourceEl.length) {
          const srcset = sourceEl.attr('srcset') || '';
          // Get the largest image from srcset
          const parts = srcset.split(',').map((s) => s.trim());
          const lastPart = parts[parts.length - 1] || '';
          imageUrl = lastPart.split(' ')[0] || '';
        }
        if (!imageUrl) {
          imageUrl = $card.find('.ep-img-link img').first().attr('src') || '';
        }

        // Venue — .ep-box-card-venue
        const venue = $card.find('.ep-box-card-venue').text().trim();

        // Date — .ep-card-event-date-start
        const dateString =
          $card.find('.ep-card-event-date-start').text().trim() || 'Date TBA';

        // Description — .ep-box-card-desc
        const description = $card.find('.ep-box-card-desc').text().trim();

        // Parse date to ISO
        const parsedDate = this.parseDate(dateString);

        events.push({
          title,
          imageUrl,
          venue,
          dateString,
          parsedDate,
          description: description.slice(0, 300),
          eventUrl,
          source: 'nairobieventsguide.com',
        });
      });

      this.logger.log(`Successfully scraped ${events.length} events`);
      this.cache = events;
      this.cacheTime = Date.now();
      return events;
    } catch (error) {
      this.logger.error(
        `Failed to scrape nairobieventsguide.com: ${(error as Error).message}`,
      );
      if (this.cache) {
        this.logger.log('Returning stale cache due to scrape failure');
        return this.cache;
      }
      return [];
    }
  }

  private fallbackParse($: cheerio.CheerioAPI): NairobiEvent[] {
    const events: NairobiEvent[] = [];

    $('a[href*="/event/"]').each((_, el) => {
      const $a = $(el);
      const title = $a.text().trim();
      if (!title || title.length < 3) return;

      const relativeUrl = $a.attr('href') || '';
      const eventUrl = relativeUrl.startsWith('http')
        ? relativeUrl
        : `${this.BASE_URL}${relativeUrl}`;

      if (events.some((e) => e.eventUrl === eventUrl)) return;

      const parent = $a.closest('div, li, article');
      const dateString =
        parent.find('[class*="date"], time').first().text().trim() || 'Date TBA';
      const imageUrl = parent.find('img').first().attr('src') || '';
      const venue = parent.find('[class*="venue"], [class*="location"]').first().text().trim() || '';

      events.push({
        title: title.replace(/^Tickets\s*\|\s*/i, ''),
        imageUrl,
        venue,
        dateString,
        parsedDate: this.parseDate(dateString),
        description: '',
        eventUrl,
        source: 'nairobieventsguide.com',
      });
    });

    this.logger.log(`Fallback parsing found ${events.length} events`);
    this.cache = events;
    this.cacheTime = Date.now();
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
