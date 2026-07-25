import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './entities/match.entity';
import {
  EventParticipation,
  EventParticipationDocument,
} from '../events/entities/event-participation.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import { MatchResultDto } from './dto/match-result.dto';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

// Seniority level ordering for compatibility scoring
const SENIORITY_LEVELS = ['entry', 'mid', 'senior', 'executive'];

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
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
   * Compute comprehensive multi-factor match scores between two users and their cards.
   * Returns individual factor scores, total weighted score, explanations, and conversation starters.
   */
  computeMatchFactors(
    userA: UserDocument | User,
    userB: UserDocument | User,
    cardA: CardDocument,
    cardB: CardDocument,
  ): {
    factors: {
      industryScore: number;
      skillsScore: number;
      interestsScore: number;
      complementarityScore: number;
      seniorityScore: number;
      locationScore: number;
    };
    totalScore: number;
    explanation: string[];
    conversationStarters: string[];
    sharedKeywords: string[];
  } {
    const factors = {
      industryScore: 0,
      skillsScore: 0,
      interestsScore: 0,
      complementarityScore: 0,
      seniorityScore: 0,
      locationScore: 0,
    };
    const explanation: string[] = [];
    const conversationStarters: string[] = [];

    // ── 1. Industry match (15%) ──────────────────────────────────
    const industryA = userA.industry?.trim();
    const industryB = userB.industry?.trim();
    if (industryA && industryB) {
      if (industryA.toLowerCase() === industryB.toLowerCase()) {
        factors.industryScore = 1;
        explanation.push(`You both work in ${industryA}`);
        conversationStarters.push(`Discuss the latest trends in ${industryA}`);
      }
      // NOTE: Future enhancement — related industry scoring could go here
    }

    // ── 2. Skills overlap (20%) ──────────────────────────────────
    const userASkills = (userA.skills || []).map((s: string) => s.toLowerCase().trim());
    const userBSkills = (userB.skills || []).map((s: string) => s.toLowerCase().trim());
    const cardASkills = (cardA.skills || []).map((s) => s.name?.toLowerCase().trim() ?? '');
    const cardBSkills = (cardB.skills || []).map((s) => s.name?.toLowerCase().trim() ?? '');

    const allSkillsA = new Set([...userASkills, ...cardASkills].filter(Boolean));
    const allSkillsB = new Set([...userBSkills, ...cardBSkills].filter(Boolean));
    factors.skillsScore = this.jaccardSimilarity(allSkillsA, allSkillsB);

    const sharedSkills = [...allSkillsA].filter((s) => allSkillsB.has(s));
    if (sharedSkills.length > 0) {
      const skillList = sharedSkills.slice(0, 3).join(', ');
      explanation.push(`Both skilled in ${skillList}`);
      conversationStarters.push(`Discuss your approach to ${sharedSkills[0]}`);
      if (sharedSkills.length > 1) {
        conversationStarters.push(`Share tips on mastering ${sharedSkills[1]}`);
      }
    }

    // ── 3. Interests overlap (10%) ──────────────────────────────
    const userAInterests = (userA.interests || []).map((s: string) => s.toLowerCase().trim());
    const userBInterests = (userB.interests || []).map((s: string) => s.toLowerCase().trim());
    const cardAInterests = (cardA.interests || []).map((i) => i.name?.toLowerCase().trim() ?? '');
    const cardBInterests = (cardB.interests || []).map((i) => i.name?.toLowerCase().trim() ?? '');

    const allInterestsA = new Set([...userAInterests, ...cardAInterests].filter(Boolean));
    const allInterestsB = new Set([...userBInterests, ...cardBInterests].filter(Boolean));
    factors.interestsScore = this.jaccardSimilarity(allInterestsA, allInterestsB);

    const sharedInterests = [...allInterestsA].filter((s) => allInterestsB.has(s));
    if (sharedInterests.length > 0) {
      const interestList = sharedInterests.slice(0, 3).join(', ');
      explanation.push(`Both interested in ${interestList}`);
      conversationStarters.push(`Share your thoughts on ${sharedInterests[0]}`);
      if (sharedInterests.length > 1) {
        conversationStarters.push(`Exchange recommendations about ${sharedInterests[1]}`);
      }
    }

    // ── 4. Complementarity: lookingFor ↔ offering (25%) ─────────
    const lookingForA = (userA.lookingFor || []).map((s: string) => s.toLowerCase().trim());
    const offeringB = (userB.offering || []).map((s: string) => s.toLowerCase().trim());
    const lookingForB = (userB.lookingFor || []).map((s: string) => s.toLowerCase().trim());
    const offeringA = (userA.offering || []).map((s: string) => s.toLowerCase().trim());

    const complementExplanations: string[] = [];
    const complementStarters: string[] = [];

    // A looks for X, B offers X
    for (const need of lookingForA) {
      if (offeringB.includes(need)) {
        complementExplanations.push(`You're looking for ${need} and they offer it`);
        complementStarters.push(`You could explore ${need} together based on their expertise`);
      }
    }
    // B looks for X, A offers X
    for (const need of lookingForB) {
      if (offeringA.includes(need)) {
        complementExplanations.push(`They're looking for ${need} and you offer it`);
        complementStarters.push(`They might benefit from your experience in ${need}`);
      }
    }

    if (complementExplanations.length > 0) {
      factors.complementarityScore = Math.min(1, complementExplanations.length / 3);
      explanation.push(...complementExplanations);
      conversationStarters.push(...complementStarters);
    }

    // ── 5. Seniority compatibility (10%) ─────────────────────────
    const seniorityA = userA.seniority?.toLowerCase().trim();
    const seniorityB = userB.seniority?.toLowerCase().trim();
    if (seniorityA && seniorityB) {
      const idxA = SENIORITY_LEVELS.indexOf(seniorityA);
      const idxB = SENIORITY_LEVELS.indexOf(seniorityB);
      if (idxA !== -1 && idxB !== -1) {
        const diff = Math.abs(idxA - idxB);
        if (diff === 0) {
          factors.seniorityScore = 1;
          explanation.push(`Both at the ${seniorityA} level`);
          conversationStarters.push(`Compare notes on navigating ${seniorityA} roles`);
        } else if (diff === 1) {
          factors.seniorityScore = 0.7;
          const higher = idxA > idxB ? seniorityA : seniorityB;
          const lower = idxA > idxB ? seniorityB : seniorityA;
          explanation.push(`You have complementary seniority levels (${lower} ↔ ${higher})`);
          conversationStarters.push(`Discuss career growth from ${lower} to ${higher} levels`);
        }
        // diff >= 2: score stays 0
      }
    }

    // ── 6. Location proximity (10%) ──────────────────────────────
    const locationA = userA.location?.trim();
    const locationB = userB.location?.trim();
    if (locationA && locationB) {
      if (locationA.toLowerCase() === locationB.toLowerCase()) {
        factors.locationScore = 1;
        explanation.push(`Both based in ${locationA}`);
        conversationStarters.push(`Meet up locally in ${locationA}`);
      } else {
        // Simple country-level check (assumes "City, Country" format)
        const countryA = locationA.split(',').pop()?.trim().toLowerCase();
        const countryB = locationB.split(',').pop()?.trim().toLowerCase();
        if (countryA && countryB && countryA === countryB) {
          factors.locationScore = 0.5;
          explanation.push(`Both in ${countryA}`);
          conversationStarters.push(`Explore events happening in ${countryA}`);
        }
      }
    }

    // ── Weighted total score ────────────────────────────────────
    const weights = {
      industryScore: 0.15,
      skillsScore: 0.20,
      interestsScore: 0.10,
      complementarityScore: 0.25,
      seniorityScore: 0.10,
      locationScore: 0.10,
    };

    const totalScore =
      factors.industryScore * weights.industryScore +
      factors.skillsScore * weights.skillsScore +
      factors.interestsScore * weights.interestsScore +
      factors.complementarityScore * weights.complementarityScore +
      factors.seniorityScore * weights.seniorityScore +
      factors.locationScore * weights.locationScore;

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

    const matchData: any[] = [];

    for (let i = 0; i < validParticipations.length; i++) {
      for (let j = i + 1; j < validParticipations.length; j++) {
        const partA = validParticipations[i];
        const partB = validParticipations[j];

        // Fetch user records (needed for multi-factor scoring)
        const [userA, userB, cardA, cardB] = await Promise.all([
          this.usersService.findById(partA.userId),
          this.usersService.findById(partB.userId),
          this.cardModel.findById(partA.cardId).exec(),
          this.cardModel.findById(partB.cardId).exec(),
        ]);

        if (!userA || !userB || !cardA || !cardB) {
          continue;
        }

        // Compute multi-factor match
        const {
          factors,
          totalScore,
          explanation,
          conversationStarters,
          sharedKeywords,
        } = this.computeMatchFactors(userA, userB, cardA, cardB);

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
            `/events/${eventId}/matches`,
          );
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
            `/events/${eventId}/matches`,
          );
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
