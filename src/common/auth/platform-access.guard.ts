import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Library, Platform, PlatformBuildJob, PlatformStaff } from '../../entities';
import { AuthProfileService } from '../../modules/user/auth-profile.service';
import type { AuthUser } from './auth-user';
import { OWNER_ONLY_KEY } from './owner-only.decorator';

interface OrganizationMembership {
  id: string;
  name: string;
  orgId: string;
  isActive: boolean;
  isSystemOrg: boolean;
  role?: { slug?: string };
}

interface CachedMemberships {
  organizations: OrganizationMembership[];
  expiresAt: number;
}

const MEMBERSHIP_CACHE_TTL_MS = 60_000;
const MEMBERSHIP_CACHE_MAX_SIZE = 500;

function extractBearerToken(request: { headers?: Record<string, string | string[] | undefined> }): string | null {
  const header = request.headers?.authorization;
  if (!header) return null;
  const value = Array.isArray(header) ? header[0] : header;
  const [type, token] = value.split(' ');
  return type === 'Bearer' && token ? token : null;
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

@Injectable()
export class PlatformAccessGuard implements CanActivate {
  private readonly authApiUrl: string;
  private readonly membershipCache = new Map<string, CachedMemberships>();

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly authProfile: AuthProfileService,
    @InjectRepository(PlatformStaff)
    private readonly platformStaffRepo: Repository<PlatformStaff>,
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    @InjectRepository(PlatformBuildJob)
    private readonly platformBuildJobRepo: Repository<PlatformBuildJob>,
  ) {
    this.authApiUrl = (this.config.get<string>('BAGDJA_AUTH_API') || 'http://localhost:4001').replace(/\/$/, '');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user?.userId) throw new ForbiddenException('User authentication required before platform access check');

    const userJwt = extractBearerToken(request);
    if (!userJwt) throw new ForbiddenException('User authentication required before platform access check');

    const organizations = await this.getUserOrganizations(userJwt);
    const ownedOrganizations = organizations.filter(
      (organization) =>
        organization.isActive &&
        !organization.isSystemOrg &&
        organization.role?.slug?.toLowerCase() === 'owner',
    );
    const ownedOrganizationIds = ownedOrganizations.map((organization) => organization.id);
    request.platformAccess = {
      isOwner: ownedOrganizationIds.length > 0,
      ownedOrganizations,
      organizations,
    };

    const ownerOnly = this.reflector.getAllAndOverride<boolean>(OWNER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const platformId = await this.resolvePlatformId(request);

    if (ownerOnly) {
      if (!platformId && request.method === 'POST') {
        const ownerOrgId = firstString(request.body?.ownerOrgId);
        if (ownerOrgId && ownedOrganizationIds.includes(ownerOrgId)) return true;
      } else if (platformId) {
        const platform = await this.platformRepo.findOne({ where: { id: platformId } });
        if (platform?.owner_org_id && ownedOrganizationIds.includes(platform.owner_org_id)) return true;
      }
      throw new ForbiddenException('This action is restricted to an Owner of the Platform organization');
    }

    if (!platformId) return true;

    const platform = await this.platformRepo.findOne({ where: { id: platformId } });
    if (!platform) throw new ForbiddenException('Platform access could not be verified');
    if (platform.owner_org_id && ownedOrganizationIds.includes(platform.owner_org_id)) return true;

    const staff = await this.platformStaffRepo.findOne({
      where: { platform_id: platformId, user_id: user.userId, is_active: true },
    });
    if (!staff) throw new ForbiddenException('You do not have access to this platform');

    request.platformStaff = staff;
    return true;
  }

  invalidateMembershipCache(authorization: string): void {
    const userJwt = extractBearerToken({ headers: { authorization } });
    if (userJwt) this.membershipCache.delete(userJwt);
  }

  private async getUserOrganizations(userJwt: string): Promise<OrganizationMembership[]> {
    const cached = this.membershipCache.get(userJwt);
    if (cached && cached.expiresAt > Date.now()) return cached.organizations;
    if (cached) this.membershipCache.delete(userJwt);

    const clientToken = await this.authProfile.getClientToken();
    if (!clientToken) throw new ForbiddenException('Bookpedia client credentials are not configured');

    let response: Response;
    try {
      response = await fetch(`${this.authApiUrl}/auth/organizations`, {
        headers: {
          'x-api-token': clientToken,
          Authorization: `Bearer ${userJwt}`,
        },
      });
    } catch {
      throw new ForbiddenException('Failed to retrieve organization memberships from bagdja-auth');
    }
    if (!response.ok) throw new ForbiddenException('Failed to retrieve organization memberships from bagdja-auth');

    const organizations = (await response.json()) as OrganizationMembership[];
    if (!Array.isArray(organizations)) {
      throw new ForbiddenException('bagdja-auth returned an invalid organization membership response');
    }

    if (this.membershipCache.size >= MEMBERSHIP_CACHE_MAX_SIZE) this.membershipCache.clear();
    this.membershipCache.set(userJwt, { organizations, expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL_MS });
    return organizations;
  }

  private async resolvePlatformId(request: {
    params?: Record<string, string | undefined>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  }): Promise<string | undefined> {
    const directId =
      firstString(request.params?.platformId) ||
      firstString(request.params?.id) ||
      firstString(request.query?.platformId) ||
      firstString(request.body?.platformId);
    if (directId) return directId;

    const libraryId = firstString(request.params?.libraryId);
    if (libraryId) {
      const library = await this.libraryRepo.findOne({ where: { id: libraryId } });
      return library?.platform_id ?? undefined;
    }

    const jobId = firstString(request.params?.jobId);
    if (jobId) {
      const job = await this.platformBuildJobRepo.findOne({
        where: [{ id: jobId }, { external_job_id: jobId }],
      });
      return job?.platform_id;
    }
    return undefined;
  }
}
