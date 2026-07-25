import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MatchingService } from '../matching/matching.service';
import { UsersService } from '../users/users.service';
import { CardsService } from '../cards/cards.service';
import { MatchResultDto } from '../matching/dto/match-result.dto';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly usersService: UsersService,
    private readonly cardsService: CardsService,
  ) {}

  /**
   * Get top recommendations for a user in an event.
   * Returns matches sorted by score descending with full explanations.
   */
  async getRecommendations(
    eventId: string,
    userId: string,
    limit: number = 10,
  ): Promise<MatchResultDto[]> {
    const matches = await this.matchingService.getMatchesForUser(
      eventId,
      userId,
    );

    // Sort by overlapScore descending (already sorted, but ensure)
    const sorted = matches.sort(
      (a, b) => b.overlapScore - a.overlapScore,
    );

    this.logger.log(
      `Returning ${Math.min(sorted.length, limit)} recommendations for user ${userId} in event ${eventId}`,
    );

    return sorted.slice(0, limit);
  }

  /**
   * Get a detailed breakdown of why a specific user pair is recommended.
   * Fetches full profiles and cards, generates enhanced explanation.
   */
  async getWhyRecommendation(
    eventId: string,
    userId: string,
    targetUserId: string,
  ): Promise<{
    match: MatchResultDto;
    userProfile: Record<string, any>;
    targetProfile: Record<string, any>;
    detailedExplanation: string[];
    detailedStarters: string[];
  }> {
    // Get all matches for the user
    const matches = await this.matchingService.getMatchesForUser(
      eventId,
      userId,
    );

    // Find the specific match involving targetUserId
    const match = matches.find((m) => m.userId === targetUserId);

    if (!match) {
      throw new NotFoundException(
        `No recommendation found for user ${targetUserId} in event ${eventId}`,
      );
    }

    // Fetch both users' full profiles
    const [userProfile, targetProfile] = await Promise.all([
      this.usersService.findById(userId),
      this.usersService.findById(targetUserId),
    ]);

    if (!userProfile || !targetProfile) {
      throw new NotFoundException('One or both user profiles not found');
    }

    // Fetch both users' cards
    const [userCards, targetCards] = await Promise.all([
      this.cardsService.findAll(userId),
      this.cardsService.findAll(targetUserId),
    ]);

    const userCard = userCards.length > 0 ? userCards[0] : null;
    const targetCard = targetCards.length > 0 ? targetCards[0] : null;

    // Generate enhanced detailed explanation
    const detailedExplanation: string[] = [];
    const detailedStarters: string[] = [];

    // Profile-level insights
    if (userProfile.industry && targetProfile.industry) {
      if (userProfile.industry.toLowerCase() === targetProfile.industry.toLowerCase()) {
        detailedExplanation.push(
          `You both work in ${userProfile.industry} — a shared industry background that makes collaboration natural.`,
        );
        detailedStarters.push(
          `What drew you to the ${userProfile.industry} industry?`,
        );
      }
    }

    if (userProfile.company && targetProfile.company) {
      detailedExplanation.push(
        `${targetProfile.displayName || 'They'} works at ${targetProfile.company} as ${targetProfile.jobRole || 'a professional'}.`,
      );
    }

    // Skills-based insights
    const allSkills =
      targetProfile.skills?.map((s: string) => s.toLowerCase().trim()) ?? [];
    if (targetCard?.skills) {
      allSkills.push(
        ...targetCard.skills.map((s) => s.name?.toLowerCase().trim() ?? ''),
      );
    }
    const uniqueTargetSkills = [...new Set(allSkills)].filter(Boolean);

    const myAllSkills =
      userProfile.skills?.map((s: string) => s.toLowerCase().trim()) ?? [];
    if (userCard?.skills) {
      myAllSkills.push(
        ...userCard.skills.map((s) => s.name?.toLowerCase().trim() ?? ''),
      );
    }
    const uniqueMySkills = [...new Set(myAllSkills)].filter(Boolean);

    const overlappingSkills = uniqueTargetSkills.filter((s) =>
      uniqueMySkills.includes(s),
    );
    const theirUniqueSkills = uniqueTargetSkills.filter(
      (s) => !uniqueMySkills.includes(s),
    );

    if (overlappingSkills.length > 0) {
      detailedExplanation.push(
        `You share ${overlappingSkills.length} skill(s): ${overlappingSkills.join(', ')}. This is a great foundation for meaningful conversation.`,
      );
      detailedStarters.push(
        `How did you get started with ${overlappingSkills[0]}?`,
      );
    }

    if (theirUniqueSkills.length > 0) {
      detailedExplanation.push(
        `${targetProfile.displayName || 'They'} brings unique skills you don't have: ${theirUniqueSkills.slice(0, 3).join(', ')}. This could be a great learning opportunity.`,
      );
      detailedStarters.push(
        `I'd love to hear about your experience with ${theirUniqueSkills[0]}`,
      );
    }

    // Complementarity insights
    const targetOffering =
      targetProfile.offering?.map((s: string) => s.toLowerCase().trim()) ?? [];
    const myLookingFor =
      userProfile.lookingFor?.map((s: string) => s.toLowerCase().trim()) ?? [];

    for (const need of myLookingFor) {
      if (targetOffering.includes(need)) {
        detailedExplanation.push(
          `You're looking for "${need}" and ${targetProfile.displayName || 'they'} offer it — a perfect complementary match.`,
        );
        detailedStarters.push(
          `Can you tell me more about how you approach ${need}?`,
        );
      }
    }

    const myOffering =
      userProfile.offering?.map((s: string) => s.toLowerCase().trim()) ?? [];
    const targetLookingFor =
      targetProfile.lookingFor?.map((s: string) => s.toLowerCase().trim()) ?? [];

    for (const need of targetLookingFor) {
      if (myOffering.includes(need)) {
        detailedExplanation.push(
          `${targetProfile.displayName || 'They'} is looking for "${need}" and you offer it — your expertise could help them.`,
        );
        detailedStarters.push(
          `I noticed you're looking for ${need} — I have experience in that area!`,
        );
      }
    }

    // Interest-based insights
    const overlappingInterests =
      (userProfile.interests || []).filter((i: string) =>
        (targetProfile.interests || []).some(
          (t: string) => t.toLowerCase().trim() === i.toLowerCase().trim(),
        ),
      );

    if (overlappingInterests.length > 0) {
      detailedExplanation.push(
        `You both enjoy ${overlappingInterests.slice(0, 3).join(', ')} — shared interests make conversations more engaging.`,
      );
      detailedStarters.push(
        `What's your favorite aspect of ${overlappingInterests[0]}?`,
      );
    }

    // Location insights
    if (userProfile.location && targetProfile.location) {
      if (
        userProfile.location.toLowerCase() ===
        targetProfile.location.toLowerCase()
      ) {
        detailedExplanation.push(
          `You're both based in ${userProfile.location} — convenient for local meetups!`,
        );
        detailedStarters.push(
          `Any favorite spots in ${userProfile.location} for networking?`,
        );
      } else {
        const countryA = userProfile.location.split(',').pop()?.trim();
        const countryB = targetProfile.location.split(',').pop()?.trim();
        if (
          countryA &&
          countryB &&
          countryA.toLowerCase() === countryB.toLowerCase()
        ) {
          detailedExplanation.push(
            `Both based in ${countryA} — there may be regional events you can attend together.`,
          );
        }
      }
    }

    return {
      match,
      userProfile: {
        id: userProfile.id,
        displayName: userProfile.displayName,
        email: userProfile.email,
        company: userProfile.company,
        jobRole: userProfile.jobRole,
        industry: userProfile.industry,
        seniority: userProfile.seniority,
        location: userProfile.location,
        avatarUrl: userProfile.avatarUrl,
        skills: userProfile.skills,
        interests: userProfile.interests,
        lookingFor: userProfile.lookingFor,
        offering: userProfile.offering,
        bio: userProfile.bio,
      },
      targetProfile: {
        id: targetProfile.id,
        displayName: targetProfile.displayName,
        email: targetProfile.email,
        company: targetProfile.company,
        jobRole: targetProfile.jobRole,
        industry: targetProfile.industry,
        seniority: targetProfile.seniority,
        location: targetProfile.location,
        avatarUrl: targetProfile.avatarUrl,
        skills: targetProfile.skills,
        interests: targetProfile.interests,
        lookingFor: targetProfile.lookingFor,
        offering: targetProfile.offering,
        bio: targetProfile.bio,
      },
      detailedExplanation,
      detailedStarters,
    };
  }
}
