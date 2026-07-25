import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { Role } from '../../common/interfaces/role.interface';
import { Organization } from './entities/organization.entity';
import { OrganizationMembership } from './entities/organization-membership.entity';
import { UsersService } from '../users/users.service';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization (user becomes owner)' })
  async create(
    @CurrentUser() jwtUser: JwtUser,
    @Body() createOrgDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    const { organization } = await this.organizationsService.create(
      createOrgDto,
      user.id,
    );
    return organization;
  }

  @Get()
  @ApiOperation({ summary: 'List my organizations' })
  async findAll(@CurrentUser() jwtUser: JwtUser): Promise<Organization[]> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.organizationsService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details (must be member)' })
  async findById(@Param('id') id: string): Promise<Organization> {
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Update organization (org_admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationsService.update(id, updateOrgDto);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles(Role.ORG_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member (org_admin only)' })
  async addMember(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() inviteMemberDto: InviteMemberDto,
  ): Promise<OrganizationMembership> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.organizationsService.addMember(
      id,
      inviteMemberDto.userId,
      inviteMemberDto.role,
      user.id,
    );
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List organization members (member only)' })
  async getMembers(@Param('id') id: string) {
    return this.organizationsService.getMembers(id);
  }

  @Patch(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ORG_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update member role (org_admin only)' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: Role,
  ): Promise<OrganizationMembership> {
    return this.organizationsService.updateMemberRole(id, userId, role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ORG_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member (org_admin only)' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.organizationsService.removeMember(id, userId);
  }
}
