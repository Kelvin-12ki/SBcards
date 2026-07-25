import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from './entities/organization.entity';
import {
  OrganizationMembership,
  OrganizationMembershipDocument,
} from './entities/organization-membership.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Role } from '../../common/interfaces/role.interface';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMembership.name)
    private readonly membershipModel: Model<OrganizationMembershipDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Generate a URL-friendly slug from a string.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
  }

  /**
   * Create a new organization and add the creator as org_admin.
   */
  async create(
    createOrgDto: CreateOrganizationDto,
    ownerId: string,
  ): Promise<{ organization: OrganizationDocument; membership: OrganizationMembershipDocument }> {
    // Generate slug if not provided
    let slug = createOrgDto.slug;
    if (!slug) {
      slug = this.slugify(createOrgDto.name);
    }

    // Ensure unique slug by appending a suffix if needed
    const existing = await this.orgModel.findOne({ slug }).exec();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).toLowerCase()}`;
    }

    const organization = await this.orgModel.create({
      ...createOrgDto,
      slug,
      ownerId,
    });

    // Add owner as org_admin
    const membership = await this.membershipModel.create({
      organizationId: organization._id.toString(),
      userId: ownerId,
      role: Role.ORG_ADMIN,
      invitedBy: ownerId,
    });

    this.logger.log(
      `Organization "${organization.name}" (${slug}) created by user ${ownerId}`,
    );

    return { organization, membership };
  }

  /**
   * Find all organizations where the user has an active membership.
   */
  async findAllForUser(userId: string): Promise<OrganizationDocument[]> {
    const memberships = await this.membershipModel
      .find({ userId, isActive: true })
      .exec();

    const orgIds = memberships.map((m) => m.organizationId);

    return this.orgModel.find({ _id: { $in: orgIds }, isActive: true }).exec();
  }

  /**
   * Find an organization by ID.
   */
  async findById(orgId: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findById(orgId).exec();

    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${orgId}" not found`,
      );
    }

    return org;
  }

  /**
   * Update an organization.
   */
  async update(
    orgId: string,
    updateOrgDto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    const org = await this.orgModel
      .findByIdAndUpdate(orgId, { $set: updateOrgDto }, { new: true })
      .exec();

    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${orgId}" not found`,
      );
    }

    return org;
  }

  /**
   * Get all active members of an organization with their user data.
   */
  async getMembers(
    orgId: string,
  ): Promise<
    {
      id: string;
      userId: string;
      role: Role;
      isActive: boolean;
      invitedBy?: string;
      joinedAt: string;
      user: {
        id: string;
        displayName?: string;
        email: string;
        avatarUrl?: string;
      } | null;
    }[]
  > {
    const memberships = await this.membershipModel
      .find({ organizationId: orgId, isActive: true })
      .exec();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const userDoc = await this.userModel.findById(m.userId).exec();

        return {
          id: m._id?.toString() ?? m.id,
          userId: m.userId,
          role: m.role as Role,
          isActive: m.isActive,
          invitedBy: m.invitedBy,
          joinedAt: m.joinedAt ? m.joinedAt.toISOString() : '',
          user: userDoc
            ? {
                id: userDoc._id?.toString() ?? userDoc.id,
                displayName: userDoc.displayName,
                email: userDoc.email,
                avatarUrl: userDoc.avatarUrl,
              }
            : null,
        };
      }),
    );

    return results;
  }

  /**
   * Add a member to an organization.
   */
  async addMember(
    orgId: string,
    userId: string,
    role: Role,
    invitedBy?: string,
  ): Promise<OrganizationMembershipDocument> {
    // Check if organization exists
    const org = await this.orgModel.findById(orgId).exec();
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${orgId}" not found`,
      );
    }

    // Check if user exists
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Check for existing membership
    const existing = await this.membershipModel
      .findOne({ organizationId: orgId, userId })
      .exec();

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(
          'User is already a member of this organization',
        );
      }

      // Reactivate
      existing.isActive = true;
      existing.role = role;
      existing.invitedBy = invitedBy;
      existing.joinedAt = new Date();
      return existing.save();
    }

    return this.membershipModel.create({
      organizationId: orgId,
      userId,
      role,
      invitedBy,
    });
  }

  /**
   * Remove (deactivate) a member from an organization.
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    const membership = await this.membershipModel
      .findOne({ organizationId: orgId, userId, isActive: true })
      .exec();

    if (!membership) {
      throw new NotFoundException(
        'Membership not found or already deactivated',
      );
    }

    membership.isActive = false;
    await membership.save();

    this.logger.log(`User ${userId} removed from organization ${orgId}`);
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    newRole: Role,
  ): Promise<OrganizationMembershipDocument> {
    const membership = await this.membershipModel
      .findOne({ organizationId: orgId, userId, isActive: true })
      .exec();

    if (!membership) {
      throw new NotFoundException(
        'Active membership not found for this user',
      );
    }

    membership.role = newRole;
    return membership.save();
  }

  /**
   * Get a user's role in an organization.
   */
  async getUserRole(
    orgId: string,
    userId: string,
  ): Promise<Role | null> {
    const membership = await this.membershipModel
      .findOne({ organizationId: orgId, userId, isActive: true })
      .exec();

    return (membership?.role as Role) ?? null;
  }

  /**
   * Check if a user is an active member of an organization.
   */
  async isMember(orgId: string, userId: string): Promise<boolean> {
    const membership = await this.membershipModel
      .findOne({ organizationId: orgId, userId, isActive: true })
      .exec();

    return !!membership;
  }
}
