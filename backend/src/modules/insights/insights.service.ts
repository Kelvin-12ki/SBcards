import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Insight, InsightDocument } from './entities/insight.entity';
import { Connection, ConnectionDocument } from '../connections/entities/connection.entity';
import { Match, MatchDocument } from '../matching/entities/match.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import { EventParticipation, EventParticipationDocument } from '../events/entities/event-participation.entity';
import { Conversation, ConversationDocument } from '../messaging/entities/conversation.entity';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectModel(Insight.name)
    private readonly insightModel: Model<InsightDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  /**
   * Safely convert a document's _id to string.
   */
  private docId(doc: { _id: any; id?: string }): string {
    return doc.id ?? String(doc._id);
  }

  /**
   * Get createdAt from a document that has timestamps.
   */
  private getCreatedAt(doc: any): Date | undefined {
    return doc.createdAt ?? doc._createdAt;
  }

  /**
   * Generate all insight types for a given user.
   * Computes and stores relationship strength, networking suggestions,
   * follow-up reminders, common connections, mutual interests, and profile tips.
   */
  async generateInsights(userId: string): Promise<{ generated: number }> {
    this.logger.log(`Generating insights for user ${userId}`);

    // Clear old insights before regenerating
    await this.insightModel.deleteMany({ userId, dismissed: false }).exec();

    let totalGenerated = 0;

    // Run all insight generators in parallel
    const results = await Promise.allSettled([
      this.generateRelationshipStrengths(userId),
      this.generateNetworkingSuggestions(userId),
      this.generateFollowUpReminders(userId),
      this.generateCommonConnections(userId),
      this.generateMutualInterests(userId),
      this.generateProfileTips(userId),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalGenerated += result.value;
      } else {
        this.logger.error(
          `Insight generation failed: ${result.reason?.message ?? result.reason}`,
        );
      }
    }

    this.logger.log(`Generated ${totalGenerated} insights for user ${userId}`);
    return { generated: totalGenerated };
  }

  /**
   * Get insights for a user, optionally filtered by type, sorted newest first.
   */
  async getInsights(
    userId: string,
    type?: string,
  ): Promise<InsightDocument[]> {
    const filter: any = { userId, dismissed: false };
    if (type) {
      filter.type = type;
    }
    return this.insightModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Mark an insight as dismissed.
   */
  async dismissInsight(insightId: string): Promise<InsightDocument> {
    const insight = await this.insightModel
      .findByIdAndUpdate(insightId, { $set: { dismissed: true } }, { new: true })
      .exec();

    if (!insight) {
      throw new NotFoundException(`Insight with ID "${insightId}" not found`);
    }

    return insight;
  }

  /**
   * Delete insights older than 30 days.
   */
  async clearOldInsights(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.insightModel
      .deleteMany({
        userId,
        createdAt: { $lt: thirtyDaysAgo },
      })
      .exec();

    this.logger.log(`Cleared ${result.deletedCount} old insights for user ${userId}`);
    return result.deletedCount;
  }

  // ─── Relationship Strength ───────────────────────────────────────────

  private async generateRelationshipStrengths(userId: string): Promise<number> {
    const connections = await this.connectionModel
      .find({ userId, status: 'accepted' })
      .exec();

    if (connections.length === 0) return 0;

    let count = 0;

    for (const connection of connections) {
      const conn: any = connection;
      const targetUserId = connection.connectedUserId;

      // Factor 1: Mutual connections (0-30)
      const mutualConnections = await this.countMutualConnections(userId, targetUserId);
      const mutualScore = Math.min(30, mutualConnections * 5);

      // Factor 2: Shared events (0-20)
      const sharedEvents = await this.countSharedEvents(userId, targetUserId);
      const eventScore = Math.min(20, sharedEvents * 5);

      // Factor 3: Profile completeness of connection (0-20)
      const targetUser = await this.userModel.findById(targetUserId).exec();
      const profileScore = targetUser ? this.computeProfileCompleteness(targetUser) * 20 : 0;

      // Factor 4: Connection recency (0-30) — newer connections score higher
      const createdAt = this.getCreatedAt(conn);
      const daysSinceConnection = createdAt
        ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      const recencyScore = Math.max(0, 30 - daysSinceConnection);

      const totalScore = Math.round(mutualScore + eventScore + profileScore + recencyScore);

      // Only create insight if score is meaningful
      if (totalScore > 15) {
        await this.insightModel.create({
          userId,
          type: 'relationship_strength',
          title: `Connection with ${targetUser?.displayName || targetUser?.email || 'Unknown'}`,
          description: `Relationship strength score: ${totalScore}/100`,
          data: {
            connectionId: this.docId(connection),
            targetUserId,
            score: totalScore,
            factors: {
              mutualConnections: mutualScore,
              sharedEvents: eventScore,
              profileCompleteness: profileScore,
              recency: Math.round(recencyScore),
            },
          },
        });
        count++;
      }
    }

    return count;
  }

  // ─── Networking Suggestions ──────────────────────────────────────────

  private async generateNetworkingSuggestions(userId: string): Promise<number> {
    // Find events the user participates in
    const participations = await this.participationModel
      .find({ userId, isVisible: true })
      .exec();

    const eventIds = participations.map((p) => p.eventId);

    if (eventIds.length === 0) return 0;

    // Find other participants in those events
    const otherParticipants = await this.participationModel
      .find({
        eventId: { $in: eventIds },
        userId: { $ne: userId },
        isVisible: true,
      })
      .exec();

    // Get existing connections to exclude
    const existingConnections = await this.connectionModel
      .find({ userId })
      .exec();
    const connectedUserIds = new Set(existingConnections.map((c) => c.connectedUserId));

    // Score each non-connected participant
    const scored: Map<string, { score: number; commonEventIds: string[]; reason: string[]; matchScore: number }> = new Map();

    for (const participant of otherParticipants) {
      if (connectedUserIds.has(participant.userId)) continue;

      if (!scored.has(participant.userId)) {
        scored.set(participant.userId, {
          score: 0,
          commonEventIds: [],
          reason: [],
          matchScore: 0,
        });
      }

      const entry = scored.get(participant.userId)!;
      entry.commonEventIds.push(participant.eventId);

      // Score based on shared events
      entry.score += 15; // +15 per shared event
    }

    // Also check mutual connections for scoring boost
    for (const [suggestedUserId] of scored) {
      const mutualCount = await this.countMutualConnections(userId, suggestedUserId);
      if (mutualCount > 0) {
        const entry = scored.get(suggestedUserId)!;
        entry.score += mutualCount * 10;
        entry.reason.push(`${mutualCount} mutual connection${mutualCount > 1 ? 's' : ''}`);
      }

      // Check complementary skills via matches
      const matchDoc = await this.matchModel
        .findOne({
          $or: [
            { userAId: userId, userBId: suggestedUserId },
            { userAId: suggestedUserId, userBId: userId },
          ],
        })
        .exec();

      if (matchDoc && matchDoc.overlapScore > 0.3) {
        const entry = scored.get(suggestedUserId)!;
        entry.score += matchDoc.overlapScore * 20;
        entry.matchScore = matchDoc.overlapScore;
        entry.reason.push(`AI match score: ${Math.round(matchDoc.overlapScore * 100)}%`);
      }
    }

    // Sort by score descending, take top 5
    const sorted = [...scored.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5);

    let count = 0;

    for (const [suggestedUserId, data] of sorted) {
      const suggestedUser = await this.userModel.findById(suggestedUserId).exec();
      if (!suggestedUser) continue;

      const reasonParts = data.reason.length > 0
        ? data.reason.join(', ')
        : 'Shared event attendance';

      await this.insightModel.create({
        userId,
        type: 'networking_suggestion',
        title: `Connect with ${suggestedUser.displayName || suggestedUser.email || 'Unknown'}`,
        description: `Suggested based on ${reasonParts}. Networking score: ${data.score}`,
        data: {
          suggestedUserId,
          score: data.score,
          commonFactors: {
            sharedEvents: data.commonEventIds.length,
            mutualConnections: data.reason.filter((r) => r.includes('mutual')).length > 0
              ? parseInt(data.reason.find((r) => r.includes('mutual'))?.split(' ')[0] ?? '0', 10)
              : 0,
            matchScore: data.matchScore ?? 0,
          },
          actionType: 'send_connection_request',
          actionData: {
            targetUserId: suggestedUserId,
          },
        },
      });
      count++;
    }

    return count;
  }

  // ─── Follow-up Reminders (Smart) ─────────────────────────────────────

  private async generateFollowUpReminders(userId: string): Promise<number> {
    const connections = await this.connectionModel
      .find({ userId, status: 'accepted' })
      .exec();

    if (connections.length === 0) return 0;

    let count = 0;

    for (const connection of connections) {
      const conn: any = connection;
      const createdAt = this.getCreatedAt(conn);
      if (!createdAt) continue;

      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const targetUser = await this.userModel.findById(connection.connectedUserId).exec();
      const targetUserName = targetUser?.displayName || targetUser?.email || 'Unknown';
      const targetUserId = connection.connectedUserId;

      // ── Check messaging history ──
      const conversation = await this.conversationModel
        .findOne({ participantIds: { $all: [userId, targetUserId] } })
        .exec();

      let lastMessageDaysAgo: number | null = null;
      let hasMessaged = false;

      if (conversation && conversation.lastMessageAt) {
        hasMessaged = true;
        lastMessageDaysAgo = (Date.now() - new Date(conversation.lastMessageAt).getTime()) / (1000 * 60 * 60 * 24);
      }

      // ── Check if target user is still active (has a profile update or event in last 14 days) ──
      const recentParticipation = await this.participationModel
        .findOne({ userId: targetUserId, isVisible: true })
        .sort({ createdAt: -1 })
        .exec();

      let targetIsActive = false;
      if (recentParticipation) {
        const lastParticipation = this.getCreatedAt(recentParticipation);
        if (lastParticipation) {
          const daysSinceActivity = (Date.now() - lastParticipation.getTime()) / (1000 * 60 * 60 * 24);
          targetIsActive = daysSinceActivity < 14;
        }
      }

      // ── Check if they connected with someone you know recently ──
      const recentMutualIds = await this.findRecentMutualConnections(userId, targetUserId, 14);

      // ── Determine urgency and generate the best insight ──
      let title = '';
      let description = '';
      let urgency = 'normal';
      let actionType = 'send_message';
      const reasons: string[] = [];

      if (hasMessaged && lastMessageDaysAgo !== null) {
        // They've chatted before — follow up based on last message
        if (lastMessageDaysAgo >= 14) {
          title = `Reconnect with ${targetUserName}`;
          description = `Your last conversation was ${Math.round(lastMessageDaysAgo)} days ago. A quick check-in could keep the relationship strong.`;
          reasons.push(`Last message ${Math.round(lastMessageDaysAgo)} days ago`);
          urgency = lastMessageDaysAgo >= 30 ? 'high' : 'normal';
        } else {
          // Less than 14 days — not urgent
          continue;
        }
      } else {
        // Never messaged — connection is older than 7 days
        if (daysSinceCreation < 14) continue;
        title = `Message ${targetUserName}`;
        description = `You connected ${Math.round(daysSinceCreation)} days ago but haven't chatted yet. Break the ice!`;
        reasons.push('Never messaged');
        urgency = daysSinceCreation >= 30 ? 'high' : 'normal';
      }

      if (targetIsActive) {
        reasons.push('Active on NEXAS');
      } else {
        reasons.push('Haven\'t seen them recently');
      }

      if (recentMutualIds.length > 0) {
        reasons.push(`${recentMutualIds.length} new mutual connection${recentMutualIds.length > 1 ? 's' : ''}`);
      }

      await this.insightModel.create({
        userId,
        type: 'follow_up_reminder',
        title,
        description: description + (reasons.length > 0 ? ` (${reasons.join(', ')})` : ''),
        data: {
          connectionId: this.docId(connection),
          targetUserId,
          targetUserName,
          daysSinceConnection: Math.round(daysSinceCreation),
          hasMessaged,
          lastMessageDaysAgo: lastMessageDaysAgo ? Math.round(lastMessageDaysAgo) : null,
          targetIsActive,
          recentMutualCount: recentMutualIds.length,
          urgency,
          actionType,
          actionData: {
            targetUserId,
            conversationId: conversation?.id ?? null,
          },
        },
      });
      count++;
    }

    return count;
  }

  /**
   * Find mutual connections who connected recently (within last N days).
   */
  private async findRecentMutualConnections(
    userAId: string,
    userBId: string,
    withinDays: number,
  ): Promise<string[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - withinDays);

    const [connectionsA, connectionsB] = await Promise.all([
      this.connectionModel.find({ userId: userAId, status: 'accepted' }).exec(),
      this.connectionModel.find({ userId: userBId, status: 'accepted' }).exec(),
    ]);

    const userAConnections = new Set(connectionsA.map((c) => c.connectedUserId));
    const userBConnections = new Set(connectionsB.map((c) => c.connectedUserId));

    const recentMutual: string[] = [];
    for (const id of userAConnections) {
      if (id !== userBId && userBConnections.has(id)) {
        // Check if this mutual connection was recent
        const connA = connectionsA.find((c) => c.connectedUserId === id);
        const createdAt = connA ? (connA as any).createdAt : null;
        if (createdAt && new Date(createdAt) >= cutoff) {
          recentMutual.push(id);
        }
      }
    }

    return recentMutual;
  }

  // ─── Common Connections ──────────────────────────────────────────────

  private async generateCommonConnections(userId: string): Promise<number> {
    const connections = await this.connectionModel
      .find({ userId, status: 'accepted' })
      .exec();

    if (connections.length === 0) return 0;

    let count = 0;

    for (const connection of connections) {
      const targetUserId = connection.connectedUserId;
      const mutualUserIds = await this.findMutualConnectionIds(userId, targetUserId);

      if (mutualUserIds.length === 0) continue;

      const targetUser = await this.userModel.findById(targetUserId).exec();
      const targetUserName = targetUser?.displayName || targetUser?.email || 'Unknown';

      await this.insightModel.create({
        userId,
        type: 'common_connection',
        title: `${mutualUserIds.length} mutual connection${mutualUserIds.length > 1 ? 's' : ''} with ${targetUserName}`,
        description: `You and ${targetUserName} share ${mutualUserIds.length} mutual connection${mutualUserIds.length > 1 ? 's' : ''}`,
        data: {
          connectionId: this.docId(connection),
          mutualUserIds,
          count: mutualUserIds.length,
        },
      });
      count++;
    }

    return count;
  }

  // ─── Mutual Interests ────────────────────────────────────────────────

  private async generateMutualInterests(userId: string): Promise<number> {
    const connections = await this.connectionModel
      .find({ userId, status: 'accepted' })
      .exec();

    if (connections.length === 0) return 0;

    const currentUser = await this.userModel.findById(userId).exec();
    if (!currentUser) return 0;

    const userSkills = new Set((currentUser.skills || []).map((s: string) => s.toLowerCase().trim()));
    const userInterests = new Set((currentUser.interests || []).map((i: string) => i.toLowerCase().trim()));

    // Also get from card
    const userCards = await this.cardModel.find({ userId }).exec();
    for (const card of userCards) {
      for (const skill of card.skills || []) {
        if (skill.name) userSkills.add(skill.name.toLowerCase().trim());
      }
      for (const interest of card.interests || []) {
        if (interest.name) userInterests.add(interest.name.toLowerCase().trim());
      }
    }

    let count = 0;

    for (const connection of connections) {
      const targetUser = await this.userModel.findById(connection.connectedUserId).exec();
      if (!targetUser) continue;

      const targetSkills = new Set((targetUser.skills || []).map((s: string) => s.toLowerCase().trim()));
      const targetInterests = new Set((targetUser.interests || []).map((i: string) => i.toLowerCase().trim()));

      const sharedSkills = [...userSkills].filter((s) => targetSkills.has(s));
      const sharedInterests = [...userInterests].filter((i) => targetInterests.has(i));

      if (sharedSkills.length === 0 && sharedInterests.length === 0) continue;

      const targetUserName = targetUser.displayName || targetUser.email || 'Unknown';

      await this.insightModel.create({
        userId,
        type: 'mutual_interest',
        title: `Shared interests with ${targetUserName}`,
        description: [
          sharedSkills.length > 0 ? `${sharedSkills.length} shared skill${sharedSkills.length > 1 ? 's' : ''}` : '',
          sharedInterests.length > 0 ? `${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}` : '',
        ].filter(Boolean).join(', '),
        data: {
          connectionId: this.docId(connection),
          sharedSkills,
          sharedInterests,
        },
      });
      count++;
    }

    return count;
  }

  // ─── Profile Tips ────────────────────────────────────────────────────

  private async generateProfileTips(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return 0;

    const tips: { tip: string; field: string; suggestion: string }[] = [];

    if (!user.bio || user.bio.trim().length === 0) {
      tips.push({
        tip: 'Add a bio to your profile',
        field: 'bio',
        suggestion: 'Write a short bio about yourself to help others learn about your background',
      });
    }

    if (!user.avatarUrl) {
      tips.push({
        tip: 'Upload a profile photo',
        field: 'avatarUrl',
        suggestion: 'Profiles with photos receive more connection requests',
      });
    }

    if (!user.skills || user.skills.length === 0) {
      tips.push({
        tip: 'Add skills to your profile',
        field: 'skills',
        suggestion: 'List your key skills to appear in more searches and matches',
      });
    }

    if (!user.industry) {
      tips.push({
        tip: 'Set your industry',
        field: 'industry',
        suggestion: 'Adding your industry helps us find better networking matches',
      });
    }

    if (!user.company) {
      tips.push({
        tip: 'Add your company',
        field: 'company',
        suggestion: 'Connecting your company helps build professional credibility',
      });
    }

    if (tips.length === 0) return 0;

    let count = 0;
    for (const tip of tips) {
      await this.insightModel.create({
        userId,
        type: 'profile_tip',
        title: tip.tip,
        description: tip.suggestion,
        data: { field: tip.field, suggestion: tip.suggestion, actionType: 'complete_profile', actionData: { field: tip.field } },
      });
      count++;
    }

    return count;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  /**
   * Count the number of mutual connections between two users.
   */
  private async countMutualConnections(
    userAId: string,
    userBId: string,
  ): Promise<number> {
    const mutualIds = await this.findMutualConnectionIds(userAId, userBId);
    return mutualIds.length;
  }

  /**
   * Find mutual connection IDs between two users.
   */
  private async findMutualConnectionIds(
    userAId: string,
    userBId: string,
  ): Promise<string[]> {
    const [connectionsA, connectionsB] = await Promise.all([
      this.connectionModel.find({ userId: userAId, status: 'accepted' }).exec(),
      this.connectionModel.find({ userId: userBId, status: 'accepted' }).exec(),
    ]);

    const userAConnections = new Set(connectionsA.map((c) => c.connectedUserId));
    const userBConnections = new Set(connectionsB.map((c) => c.connectedUserId));

    const mutual: string[] = [];
    for (const id of userAConnections) {
      if (id !== userBId && userBConnections.has(id)) {
        mutual.push(id);
      }
    }

    return mutual;
  }

  /**
   * Count shared events between two users.
   */
  private async countSharedEvents(
    userAId: string,
    userBId: string,
  ): Promise<number> {
    const [eventsA, eventsB] = await Promise.all([
      this.participationModel.find({ userId: userAId, isVisible: true }).exec(),
      this.participationModel.find({ userId: userBId, isVisible: true }).exec(),
    ]);

    const userAEventIds = new Set(eventsA.map((e) => e.eventId));
    const userBEventIds = new Set(eventsB.map((e) => e.eventId));

    let shared = 0;
    for (const eventId of userAEventIds) {
      if (userBEventIds.has(eventId)) shared++;
    }

    return shared;
  }

  /**
   * Compute profile completeness as a ratio (0-1).
   */
  private computeProfileCompleteness(user: UserDocument): number {
    const fields = [
      user.displayName,
      user.email,
      user.avatarUrl,
      user.bio,
      user.company,
      user.industry,
      user.skills && user.skills.length > 0 ? user.skills : null,
      user.interests && user.interests.length > 0 ? user.interests : null,
      user.location,
      user.title,
    ];

    const filled = fields.filter((f) => f !== null && f !== undefined && f !== '').length;
    return filled / fields.length;
  }
}
