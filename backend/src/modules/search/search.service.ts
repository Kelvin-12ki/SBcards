import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import { Event, EventDocument } from '../events/entities/event.entity';
import { Session, SessionDocument } from '../sessions/entities/session.entity';
import { Exhibitor, ExhibitorDocument } from '../exhibitors/entities/exhibitor.entity';
import { Organization, OrganizationDocument } from '../organizations/entities/organization.entity';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Card.name) private readonly cardModel: Model<CardDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Exhibitor.name) private readonly exhibitorModel: Model<ExhibitorDocument>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  /**
   * Escape special regex characters in a query string.
   */
  private escapeRegex(query: string): string {
    return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Build a case-insensitive regex from a query string.
   */
  private buildRegex(query: string): RegExp {
    return new RegExp(this.escapeRegex(query), 'i');
  }

  /**
   * Compute a simple relevance score based on exactness of match.
   * Higher score for matches at the start of the field.
   */
  private computeRelevance(fieldValue: string | undefined | null, query: string): number {
    if (!fieldValue) return 0;
    const lower = fieldValue.toLowerCase();
    const lowerQuery = query.toLowerCase();
    if (lower === lowerQuery) return 1;
    if (lower.startsWith(lowerQuery)) return 0.8;
    if (lower.includes(lowerQuery)) return 0.5;
    return 0;
  }

  /**
   * Safely convert a document's _id to string.
   */
  private docId(doc: { _id: any; id?: string }): string {
    return doc.id ?? String(doc._id);
  }

  /**
   * Global search across all entities.
   * Returns results grouped by type with relevance scores, sorted by score descending.
   */
  async globalSearch(
    query: string,
    _userId?: string,
  ): Promise<{
    users: any[];
    cards: any[];
    events: any[];
    sessions: any[];
    exhibitors: any[];
    organizations: any[];
  }> {
    if (!query || query.trim().length === 0) {
      return { users: [], cards: [], events: [], sessions: [], exhibitors: [], organizations: [] };
    }

    const q = query.trim();
    const regex = this.buildRegex(q);

    const [users, cards, events, sessions, exhibitors, organizations] = await Promise.all([
      this.searchUsersHelper(q, regex),
      this.searchCardsHelper(q, regex),
      this.searchEventsHelper(q, regex),
      this.searchSessionsHelper(q, regex),
      this.searchExhibitorsHelper(q, regex),
      this.searchOrganizationsHelper(q, regex),
    ]);

    return { users, cards, events, sessions, exhibitors, organizations };
  }

  /**
   * Search people (users) with optional filters.
   */
  async searchPeople(
    query: string,
    filters?: {
      industry?: string;
      skills?: string;
      company?: string;
      seniority?: string;
    },
  ): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const q = query.trim();
    const regex = this.buildRegex(q);
    const filter: any = {
      $or: [
        { displayName: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { company: regex },
        { industry: regex },
        { bio: regex },
        { skills: regex },
      ],
    };

    if (filters?.industry) {
      filter.industry = { $regex: this.buildRegex(filters.industry) };
    }
    if (filters?.skills) {
      filter.skills = { $regex: this.buildRegex(filters.skills) };
    }
    if (filters?.company) {
      filter.company = { $regex: this.buildRegex(filters.company) };
    }
    if (filters?.seniority) {
      filter.seniority = filters.seniority;
    }

    const users = await this.userModel.find(filter).limit(50).exec();
    return this.enrichUsersWithScore(users, q);
  }

  /**
   * Search events with optional filters.
   */
  async searchEvents(
    query: string,
    filters?: {
      date?: string;
      location?: string;
      tags?: string;
    },
  ): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const q = query.trim();
    const regex = this.buildRegex(q);
    const filter: any = {
      $or: [
        { name: regex },
        { description: regex },
        { tags: regex },
      ],
    };

    if (filters?.location) {
      filter.location = { $regex: this.buildRegex(filters.location) };
    }
    if (filters?.tags) {
      filter.tags = { $regex: this.buildRegex(filters.tags) };
    }
    if (filters?.date) {
      const date = new Date(filters.date);
      if (!isNaN(date.getTime())) {
        filter.startDate = { $lte: date };
        filter.endDate = { $gte: date };
      }
    }

    const events = await this.eventModel.find(filter).limit(50).exec();
    return this.enrichEventsWithScore(events, q);
  }

  /**
   * Search companies across users and exhibitors.
   */
  async searchCompanies(query: string): Promise<{
    users: any[];
    exhibitors: any[];
  }> {
    if (!query || query.trim().length === 0) {
      return { users: [], exhibitors: [] };
    }

    const q = query.trim();
    const regex = this.buildRegex(q);

    const [users, exhibitors] = await Promise.all([
      this.userModel.find({ company: regex }).limit(20).exec(),
      this.exhibitorModel.find({ companyName: regex }).limit(20).exec(),
    ]);

    return {
      users: users.map((u) => ({
        id: this.docId(u),
        displayName: u.displayName,
        email: u.email,
        company: u.company,
        title: u.title,
        avatarUrl: u.avatarUrl,
        type: 'user',
      })),
      exhibitors: exhibitors.map((e) => ({
        id: this.docId(e),
        companyName: e.companyName,
        description: e.description,
        logoUrl: e.logoUrl,
        products: e.products,
        services: e.services,
        eventId: e.eventId,
        type: 'exhibitor',
      })),
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  private async searchUsersHelper(query: string, regex: RegExp): Promise<any[]> {
    const users = await this.userModel
      .find({
        $or: [
          { displayName: regex },
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { company: regex },
          { industry: regex },
          { bio: regex },
          { skills: regex },
        ],
      })
      .limit(10)
      .exec();
    return this.enrichUsersWithScore(users, query);
  }

  private async searchCardsHelper(query: string, regex: RegExp): Promise<any[]> {
    const cards = await this.cardModel
      .find({
        $or: [
          { fullName: regex },
          { headline: regex },
          { company: regex },
          { bio: regex },
        ],
      })
      .limit(10)
      .exec();

    return cards.map((c) => {
      const score = Math.max(
        this.computeRelevance(c.fullName, query),
        this.computeRelevance(c.headline, query),
        this.computeRelevance(c.company, query),
        this.computeRelevance(c.bio, query),
      );
      return {
        id: this.docId(c),
        userId: c.userId,
        fullName: c.fullName,
        headline: c.headline,
        company: c.company,
        role: c.role,
        bio: c.bio,
        avatarUrl: c.avatarUrl,
        type: 'card',
        relevanceScore: score,
      };
    });
  }

  private async searchEventsHelper(query: string, regex: RegExp): Promise<any[]> {
    const events = await this.eventModel
      .find({
        $or: [
          { name: regex },
          { description: regex },
          { tags: regex },
        ],
      })
      .limit(10)
      .exec();
    return this.enrichEventsWithScore(events, query);
  }

  private async searchSessionsHelper(query: string, regex: RegExp): Promise<any[]> {
    const sessions = await this.sessionModel
      .find({
        $or: [
          { title: regex },
          { description: regex },
          { tags: regex },
        ],
      })
      .limit(10)
      .exec();

    return sessions.map((s) => {
      const score = Math.max(
        this.computeRelevance(s.title, query),
        this.computeRelevance(s.description, query),
      );
      return {
        id: this.docId(s),
        eventId: s.eventId,
        title: s.title,
        description: s.description,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location,
        sessionType: s.type,
        tags: s.tags,
        type: 'session',
        relevanceScore: score,
      };
    });
  }

  private async searchExhibitorsHelper(query: string, regex: RegExp): Promise<any[]> {
    const exhibitors = await this.exhibitorModel
      .find({
        $or: [
          { companyName: regex },
          { products: regex },
          { services: regex },
          { description: regex },
        ],
      })
      .limit(10)
      .exec();

    return exhibitors.map((e) => {
      const score = Math.max(
        this.computeRelevance(e.companyName, query),
        this.computeRelevance(e.description, query),
      );
      return {
        id: this.docId(e),
        eventId: e.eventId,
        companyName: e.companyName,
        description: e.description,
        logoUrl: e.logoUrl,
        products: e.products,
        services: e.services,
        boothNumber: e.boothNumber,
        type: 'exhibitor',
        relevanceScore: score,
      };
    });
  }

  private async searchOrganizationsHelper(query: string, regex: RegExp): Promise<any[]> {
    const orgs = await this.organizationModel
      .find({
        $or: [
          { name: regex },
          { description: regex },
        ],
      })
      .limit(10)
      .exec();

    return orgs.map((o) => {
      const score = Math.max(
        this.computeRelevance(o.name, query),
        this.computeRelevance(o.description, query),
      );
      return {
        id: this.docId(o),
        name: o.name,
        slug: o.slug,
        description: o.description,
        logoUrl: o.logoUrl,
        type: 'organization',
        relevanceScore: score,
      };
    });
  }

  private enrichUsersWithScore(users: UserDocument[], query: string): any[] {
    return users.map((u) => {
      const score = Math.max(
        this.computeRelevance(u.displayName, query),
        this.computeRelevance(u.company, query),
        this.computeRelevance(u.industry, query),
        this.computeRelevance(u.bio, query),
        this.computeRelevance(u.email, query),
      );
      return {
        id: this.docId(u),
        firebaseUid: u.firebaseUid,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        title: u.title,
        company: u.company,
        industry: u.industry,
        seniority: u.seniority,
        skills: u.skills,
        interests: u.interests,
        bio: u.bio,
        location: u.location,
        type: 'user',
        relevanceScore: score,
      };
    });
  }

  private enrichEventsWithScore(events: EventDocument[], query: string): any[] {
    return events.map((e) => {
      const score = Math.max(
        this.computeRelevance(e.name, query),
        this.computeRelevance(e.description, query),
      );
      return {
        id: this.docId(e),
        creatorId: e.creatorId,
        organizationId: e.organizationId,
        name: e.name,
        description: e.description,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status,
        isActive: e.isActive,
        type: 'event',
        relevanceScore: score,
      };
    });
  }
}
