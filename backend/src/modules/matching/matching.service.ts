import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './entities/match.entity';
import {
  EventParticipation,
  EventParticipationDocument,
} from '../events/entities/event-participation.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import {
  Connection,
  ConnectionDocument,
} from '../connections/entities/connection.entity';
import { MatchResultDto } from './dto/match-result.dto';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { Event, EventDocument } from '../events/entities/event.entity';

/** Complementary industry pairs — industries that naturally benefit from networking */
const INDUSTRY_AFFINITY: Record<string, string[]> = {
  fintech: ['blockchain', 'banking', 'finance', 'crypto', 'defi'],
  blockchain: ['fintech', 'web3', 'crypto', 'defi'],
  health: ['biotech', 'medtech', 'healthtech', 'pharmaceutical'],
  biotech: ['health', 'healthtech', 'pharmaceutical', 'life sciences'],
  saas: ['consulting', 'enterprise', 'b2b', 'software'],
  consulting: ['saas', 'enterprise', 'management', 'strategy'],
  education: ['edtech', 'training', 'learning', 'e-learning'],
  edtech: ['education', 'e-learning', 'training'],
  marketing: ['advertising', 'media', 'branding', 'pr'],
  advertising: ['marketing', 'media', 'branding', 'pr'],
  ai: ['machine learning', 'data science', 'analytics', 'tech'],
  'data science': ['ai', 'machine learning', 'analytics', 'tech'],
  ecommerce: ['retail', 'd2c', 'marketplace', 'logistics'],
  'real estate': ['proptech', 'construction', 'architecture'],
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectModel(Match.name)
    private readonly matchesModel: Model<MatchDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  /**
   * Only the event's creator (or an admin) may trigger a match run.
   *
   * Mirrors TablesService.assertOrganizer. Running matching writes a full
   * pairwise scoring table over every participant's profile, so leaving it
   * open to any authenticated user let a stranger both burn the event's
   * compute and overwrite its match set.
   *
   * Deliberately NOT satisfied by `role === 'organizer'` alone: that would
   * let any organizer act on an event they do not own.
   */
  async assertOrganizer(
    eventId: string,
    userId: string,
    role?: string,
  ): Promise<EventDocument> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.creatorId !== userId && role !== 'admin') {
      throw new ForbiddenException(
        'Only the event creator can run matching for this event',
      );
    }
    return event;
  }

  /**
   * Get keywords (skill names + interest names) for a given card.
   */
  async getKeywordsForCard(
    cardId: string,
  ): Promise<{ skills: string[]; interests: string[] }> {
    const card = await this.cardModel.findById(cardId).exec();

    if (!card) {
      return { skills: [], interests: [] };
    }

    return {
      skills: (card.skills || []).map((s) => s.name.toLowerCase().trim()),
      interests: (card.interests || []).map((i) => i.name.toLowerCase().trim()),
    };
  }

  /**
   * Compute Jaccard similarity between two sets of strings.
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) {
      return 0;
    }

    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersection++;
      }
    }

    const union = new Set([...setA, ...setB]);
    return intersection / union.size;
  }

  /**
   * Check if two industries are complementary using the affinity map.
   */
  private areIndustriesComplementary(a: string, b: string): boolean {
    const aLower = a.toLowerCase().trim();
    const bLower = b.toLowerCase().trim();

    const aAffinities = INDUSTRY_AFFINITY[aLower] || [];
    if (aAffinities.includes(bLower)) return true;

    const bAffinities = INDUSTRY_AFFINITY[bLower] || [];
    if (bAffinities.includes(aLower)) return true;

    return false;
  }

  /**
   * Compute comprehensive 5-factor match scores between two users.
   *
   * Factors:
   * 1. Skill Complementarity (30%) — do they have skills the other needs?
   * 2. Industry Relevance (25%) — same or complementary industries
   * 3. Interest Overlap (20%) — shared interests
   * 4. Networking Goal Alignment (15%) — lookingFor ↔ offering matches
   * 5. Connection Status (10%) — boost new connections
   */
  computeMatchFactors(
    userA: UserDocument | User,
    userB: UserDocument | User,
    cardA: CardDocument,
    cardB: CardDocument,
    connectionStatus: 'none' | 'pending' | 'accepted' = 'none',
  ): {
    factors: {
      skillComplementarityScore: number;
      industryRelevanceScore: number;
      interestOverlapScore: number;
      networkingGoalScore: number;
      connectionStatusScore: number;
    };
    totalScore: number;
    explanation: string[];
    conversationStarters: string[];
    sharedKeywords: string[];
  } {
    const factors = {
      skillComplementarityScore: 0,
      industryRelevanceScore: 0,
      interestOverlapScore: 0,
      networkingGoalScore: 0,
      connectionStatusScore: 0,
    };
    const explanation: string[] = [];
    const conversationStarters: string[] = [];

    // ── 1. SKILL COMPLEMENTARITY (30%) ──────────────────────────
    // Does A have skills B needs, and vice versa?
    const userASkills = (userA.skills || []).map((s: string) => s.toLowerCase().trim());
    const userBSkills = (userB.skills || []).map((s: string) => s.toLowerCase().trim());
    const cardASkills = (cardA.skills || []).map((s) => s.name?.toLowerCase().trim() ?? '');
    const cardBSkills = (cardB.skills || []).map((s) => s.name?.toLowerCase().trim() ?? '');

    const allSkillsA = new Set([...userASkills, ...cardASkills].filter(Boolean));
    const allSkillsB = new Set([...userBSkills, ...cardBSkills].filter(Boolean));

    // Base score: how many of A's skills B needs + vice versa
    const lookingForA = (userA.lookingFor || []).map((s: string) => s.toLowerCase().trim());
    const lookingForB = (userB.lookingFor || []).map((s: string) => s.toLowerCase().trim());

    let skillMatches = 0;
    for (const skill of allSkillsA) {
      if (lookingForB.some((need) => skill.includes(need) || need.includes(skill))) {
        skillMatches++;
      }
    }
    for (const skill of allSkillsB) {
      if (lookingForA.some((need) => skill.includes(need) || need.includes(skill))) {
        skillMatches++;
      }
    }
    const baseSkillScore = Math.min(0.5, skillMatches / 4);

    // Diversity bonus: different skill sets complement each other
    const diversity = 1 - this.jaccardSimilarity(allSkillsA, allSkillsB);
    const diversityBonus = diversity * 0.3;

    factors.skillComplementarityScore = Math.min(1, baseSkillScore + diversityBonus);

    const sharedSkills = [...allSkillsA].filter((s) => allSkillsB.has(s));
    if (sharedSkills.length > 0) {
      explanation.push(`Both skilled in ${sharedSkills.slice(0, 3).join(', ')}`);
      conversationStarters.push(`Discuss your approach to ${sharedSkills[0]}`);
    }
    if (skillMatches > 0) {
      explanation.push(`You have complementary expertise — ${skillMatches} skill${skillMatches > 1 ? 's' : ''} the other is looking for`);
      conversationStarters.push(`Explore how your skills can complement each other`);
    }

    // ── 2. INDUSTRY RELEVANCE (25%) ─────────────────────────────
    const industryA = userA.industry?.trim();
    const industryB = userB.industry?.trim();

    if (industryA && industryB) {
      if (industryA.toLowerCase() === industryB.toLowerCase()) {
        factors.industryRelevanceScore = 1.0;
        explanation.push(`You both work in ${industryA}`);
        conversationStarters.push(`Discuss the latest trends in ${industryA}`);
      } else if (this.areIndustriesComplementary(industryA, industryB)) {
        factors.industryRelevanceScore = 0.7;
        explanation.push(`${industryA} and ${industryB} are complementary industries`);
        conversationStarters.push(`Explore cross-industry opportunities between ${industryA} and ${industryB}`);
      } else {
        factors.industryRelevanceScore = 0.1;
      }
    }

    // ── 3. INTEREST OVERLAP (20%) ───────────────────────────────
    const userAInterests = (userA.interests || []).map((s: string) => s.toLowerCase().trim());
    const userBInterests = (userB.interests || []).map((s: string) => s.toLowerCase().trim());
    const cardAInterests = (cardA.interests || []).map((i) => i.name?.toLowerCase().trim() ?? '');
    const cardBInterests = (cardB.interests || []).map((i) => i.name?.toLowerCase().trim() ?? '');

    const allInterestsA = new Set([...userAInterests, ...cardAInterests].filter(Boolean));
    const allInterestsB = new Set([...userBInterests, ...cardBInterests].filter(Boolean));

    if (allInterestsA.size === 0 && allInterestsB.size === 0) {
      factors.interestOverlapScore = 0.5; // neutral
    } else {
      factors.interestOverlapScore = this.jaccardSimilarity(allInterestsA, allInterestsB);
    }

    const sharedInterests = [...allInterestsA].filter((s) => allInterestsB.has(s));
    if (sharedInterests.length > 0) {
      explanation.push(`Both interested in ${sharedInterests.slice(0, 3).join(', ')}`);
      conversationStarters.push(`Share your thoughts on ${sharedInterests[0]}`);
      if (sharedInterests.length > 1) {
        conversationStarters.push(`Exchange recommendations about ${sharedInterests[1]}`);
      }
    }

    // ── 4. NETWORKING GOAL ALIGNMENT (15%) ──────────────────────
    const offeringA = (userA.offering || []).map((s: string) => s.toLowerCase().trim());
    const offeringB = (userB.offering || []).map((s: string) => s.toLowerCase().trim());

    let goalMatches = 0;

    // A looks for X, B offers X
    for (const need of lookingForA) {
      if (offeringB.some((o) => o.includes(need) || need.includes(o))) {
        goalMatches += 0.5;
        explanation.push(`You're looking for ${need} and they offer it`);
        conversationStarters.push(`You could explore ${need} together based on their expertise`);
      }
    }
    // B looks for X, A offers X
    for (const need of lookingForB) {
      if (offeringA.some((o) => o.includes(need) || need.includes(o))) {
        goalMatches += 0.5;
        explanation.push(`They're looking for ${need} and you offer it`);
        conversationStarters.push(`They might benefit from your experience in ${need}`);
      }
    }
    // Both have same lookingFor → partial credit
    const sharedGoals = lookingForA.filter((g) => lookingForB.includes(g));
    if (sharedGoals.length > 0) {
      goalMatches += 0.3;
      explanation.push(`You both share goals: ${sharedGoals.slice(0, 2).join(', ')}`);
    }

    factors.networkingGoalScore = Math.min(1, goalMatches / 2);

    // ── 5. CONNECTION STATUS (10%) ──────────────────────────────
    if (connectionStatus === 'accepted') {
      factors.connectionStatusScore = 0; // already connected, no boost
    } else if (connectionStatus === 'pending') {
      factors.connectionStatusScore = 0.3;
    } else {
      factors.connectionStatusScore = 1.0; // new connection — maximum boost
      explanation.push(`Great opportunity to make a new connection`);
    }

    // ── WEIGHTED TOTAL ──────────────────────────────────────────
    const totalScore =
      factors.skillComplementarityScore * 0.30 +
      factors.industryRelevanceScore * 0.25 +
      factors.interestOverlapScore * 0.20 +
      factors.networkingGoalScore * 0.15 +
      factors.connectionStatusScore * 0.10;

    // ── Shared keywords for backward compatibility ──────────────
    const sharedKeywords = [
      ...sharedSkills,
      ...sharedInterests,
    ];

    return { factors, totalScore, explanation, conversationStarters, sharedKeywords };
  }

  /**
   * Run the matching algorithm for an event.
   * Uses multi-factor scoring with explanations and conversation starters.
   */
  async runMatching(eventId: string): Promise<MatchDocument[]> {
    // Get all visible participations
    const participations = await this.participationModel
      .find({ eventId, isVisible: true })
      .exec();

    if (participations.length < 2) {
      this.logger.log(
        `Not enough participants to run matching for event ${eventId}`,
      );
      return [];
    }

    // Filter out participations without card
    const validParticipations = participations.filter((p) => p.cardId);
    if (validParticipations.length < 2) {
      return [];
    }

    // Delete existing matches for this event
    await this.matchesModel.deleteMany({ eventId }).exec();

    // Batch-fetch all connections for participants (single query for performance)
    const participantIds = validParticipations.map((p) => p.userId);
    const allConnections = await this.connectionModel
      .find({
        $or: [
          { userId: { $in: participantIds }, connectedUserId: { $in: participantIds } },
        ],
        status: { $in: ['accepted', 'pending'] },
      })
      .select('userId connectedUserId status')
      .lean()
      .exec();

    // Build a lookup map: "userId:connectedUserId" → status
    const connectionMap = new Map<string, string>();
    for (const conn of allConnections) {
      const key1 = `${conn.userId}:${conn.connectedUserId}`;
      const key2 = `${conn.connectedUserId}:${conn.userId}`;
      connectionMap.set(key1, conn.status);
      connectionMap.set(key2, conn.status);
    }

    // Batch-fetch every participant's user and card before the pairwise loop.
    // The loop is O(n^2), so per-pair lookups meant O(n^2) round-trips to
    // Mongo; this reduces the whole run to two queries.
    const uniqueUserIds = Array.from(
      new Set(validParticipations.map((p) => p.userId)),
    );
    const uniqueCardIds = Array.from(
      new Set(
        validParticipations
          .map((p) => p.cardId)
          .filter((id): id is string => !!id),
      ),
    );
    const [allUsers, allCards] = await Promise.all([
      this.usersService.findByIds(uniqueUserIds),
      this.cardModel.find({ _id: { $in: uniqueCardIds } }).exec(),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id as string, u]));
    const cardMap = new Map(allCards.map((c) => [c.id as string, c]));

    const matchData: any[] = [];

    for (let i = 0; i < validParticipations.length; i++) {
      for (let j = i + 1; j < validParticipations.length; j++) {
        const partA = validParticipations[i];
        const partB = validParticipations[j];

        // User + card records for multi-factor scoring, served from the
        // maps built above rather than re-queried per pair.
        const userA = userMap.get(partA.userId);
        const userB = userMap.get(partB.userId);
        const cardA = partA.cardId ? cardMap.get(partA.cardId) : undefined;
        const cardB = partB.cardId ? cardMap.get(partB.cardId) : undefined;

        if (!userA || !userB || !cardA || !cardB) {
          continue;
        }

        // Look up connection status between these two users
        const connKey = `${partA.userId}:${partB.userId}`;
        const connStatus = connectionMap.get(connKey) || 'none';

        // Compute multi-factor match
        const {
          factors,
          totalScore,
          explanation,
          conversationStarters,
          sharedKeywords,
        } = this.computeMatchFactors(userA, userB, cardA, cardB, connStatus as 'none' | 'pending' | 'accepted');

        // Order user IDs for consistency
        const [userAId, userBId] =
          partA.userId < partB.userId
            ? [partA.userId, partB.userId]
            : [partB.userId, partA.userId];
        const [cardAId, cardBId] =
          partA.userId < partB.userId
            ? [partA.cardId!, partB.cardId!]
            : [partB.cardId!, partA.cardId!];

        matchData.push({
          eventId,
          userAId,
          userBId,
          cardAId,
          cardBId,
          overlapScore: Math.round(totalScore * 100) / 100,
          sharedKeywords,
          factors,
          explanation,
          conversationStarters,
        });
      }
    }

    // Save all matches
    if (matchData.length > 0) {
      await this.matchesModel.insertMany(matchData);
    }

    // Notify users about new matches (batch)
    try {
      const notifiedUsers = new Set<string>();

      for (const match of matchData) {
        // Notify userA about match with userB
        if (!notifiedUsers.has(match.userAId)) {
          const userBMatchCount = matchData.filter(
            (m) => m.userAId === match.userAId || m.userBId === match.userAId,
          ).length;

          await this.notificationsService.create(
            match.userAId,
            'match_new',
            'New AI Match!',
            `You have ${userBMatchCount} new match${userBMatchCount > 1 ? 'es' : ''} based on your profile compatibility.`,
            `/ai-match/${eventId}`,
          );

          // Send push notification
          this.pushService.sendPush(
            match.userAId,
            'New AI Match!',
            `You have ${userBMatchCount} new match${userBMatchCount > 1 ? 'es' : ''} based on your profile compatibility.`,
            { type: 'ai_match', id: eventId, matchCount: String(userBMatchCount) },
          ).catch(() => {});

          notifiedUsers.add(match.userAId);
        }

        // Notify userB about match with userA
        if (!notifiedUsers.has(match.userBId)) {
          const userAMatchCount = matchData.filter(
            (m) => m.userAId === match.userBId || m.userBId === match.userBId,
          ).length;

          await this.notificationsService.create(
            match.userBId,
            'match_new',
            'New AI Match!',
            `You have ${userAMatchCount} new match${userAMatchCount > 1 ? 'es' : ''} based on your profile compatibility.`,
            `/ai-match/${eventId}`,
          );

          // Send push notification
          this.pushService.sendPush(
            match.userBId,
            'New AI Match!',
            `You have ${userAMatchCount} new match${userAMatchCount > 1 ? 'es' : ''} based on your profile compatibility.`,
            { type: 'ai_match', id: eventId, matchCount: String(userAMatchCount) },
          ).catch(() => {});

          notifiedUsers.add(match.userBId);
        }
      }
    } catch (hookError) {
      this.logger.error(
        `Failed to send match notifications: ${(hookError as Error).message}`,
      );
    }

    this.logger.log(
      `Matching complete for event ${eventId}: ${matchData.length} matches found`,
    );

    return this.matchesModel.find({ eventId }).exec();
  }

  /**
   * Get all matches for a specific user in an event, ordered by score DESC.
   * Returns enriched match data including factors, explanations, and matched user profile.
   */
  async getMatchesForUser(
    eventId: string,
    userId: string,
  ): Promise<MatchResultDto[]> {
    const matches = await this.matchesModel
      .find({
        eventId,
        $or: [{ userAId: userId }, { userBId: userId }],
      })
      .sort({ overlapScore: -1 })
      .exec();

    const results: MatchResultDto[] = [];

    for (const match of matches) {
      const matchedUserId =
        match.userAId === userId ? match.userBId : match.userAId;
      const matchedCardId =
        match.userAId === userId ? match.cardBId : match.cardAId;

      const [matchedUser, matchedCard] = await Promise.all([
        this.usersService.findById(matchedUserId),
        this.cardModel.findById(matchedCardId).exec(),
      ]);

      results.push({
        matchId: match.id,
        userId: matchedUserId,
        userName:
          matchedUser?.displayName || matchedUser?.email || 'Unknown',
        cardId: matchedCardId,
        overlapScore: Number(match.overlapScore),
        sharedKeywords: match.sharedKeywords,
        factors: match.factors,
        explanation: match.explanation,
        conversationStarters: match.conversationStarters,
        matchedUserProfile: {
          displayName: matchedUser?.displayName,
          company: matchedUser?.company,
          jobRole: matchedUser?.jobRole,
          industry: matchedUser?.industry,
          avatarUrl: matchedUser?.avatarUrl,
          skills: matchedUser?.skills,
          interests: matchedUser?.interests,
        },
      });
    }

    return results;
  }
}
