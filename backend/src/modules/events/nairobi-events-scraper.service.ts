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

      // EventPrime plugin renders event cards in various selectors
      // Try multiple selectors for resilience
      const selectors = [
        '.ep-card',
        '.ep-card-list',
        '.eventprime-event-card',
        '.ep-event-card',
        '[class*="ep-card"]',
        '.event-card',
        'article',
      ];

      let cards = $(selectors[0]);
      for (const selector of selectors) {
        cards = $(selector);
        if (cards.length > 0) {
          this.logger.log(`Found ${cards.length} cards with selector: ${selector}`);
          break;
        }
      }

      if (cards.length === 0) {
        // Fallback: try to find event links in the page
        this.logger.warn('No event cards found with standard selectors, trying fallback parsing');
        return this.fallbackParse($);
      }

      cards.each((_, card) => {
        const $card = $(card);

        // Extract title
        const title =
          $card.find('h3, h4, .ep-card-title, [class*="title"] a').first().text().trim() ||
          $card.find('a').first().text().trim();

        if (!title) return; // skip empty cards

        // Extract event URL
        const linkEl = $card.find('a[href*="/event/"]').first();
        const relativeUrl = linkEl.attr('href') || $card.find('a').first().attr('href') || '';
        const eventUrl = relativeUrl.startsWith('http')
          ? relativeUrl
          : `${this.BASE_URL}${relativeUrl}`;

        // Extract image
        const imageUrl =
          $card.find('img').first().attr('src') ||
          $card.find('img').first().attr('data-src') ||
          '';

        // Extract venue/location
        const venue =
          $card.find('[class*="venue"], [class*="location"], [class*="location_on"]')
            .first()
            .text()
            .trim() || '';

        // Extract date
        const dateEl = $card.find('[class*="date"], [class*="time"], time').first();
        const dateString = dateEl.text().trim() || '';

        // Extract description
        const description =
          $card.find('p, [class*="desc"], [class*="excerpt"]').first().text().trim() || '';

        // Parse date to ISO
        const parsedDate = this.parseDate(dateString);

        events.push({
          title,
          imageUrl,
          venue,
          dateString: dateString || 'Date TBA',
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
      // Return stale cache if available
      if (this.cache) {
        this.logger.log('Returning stale cache due to scrape failure');
        return this.cache;
      }
      return [];
    }
  }

  private fallbackParse($: cheerio.CheerioAPI): NairobiEvent[] {
    const events: NairobiEvent[] = [];

    // Find all links to /event/ pages
    $('a[href*="/event/"]').each((_, el) => {
      const $a = $(el);
      const title = $a.text().trim();
      if (!title || title.length < 3) return;

      const relativeUrl = $a.attr('href') || '';
      const eventUrl = relativeUrl.startsWith('http')
        ? relativeUrl
        : `${this.BASE_URL}${relativeUrl}`;

      // Avoid duplicates
      if (events.some((e) => e.eventUrl === eventUrl)) return;

      // Try to find date near this element
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
      // Handle formats like "Fri, August 7, 2026 06:00 PM" or "Sat, August 1, 2026"
      const cleaned = dateStr
        .replace(/^Mon|Tue|Wed|Thu|Fri|Sat|Sun,?\s*/i, '')
        .replace(/\s*–\s*.*$/, ''); // remove end date
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
