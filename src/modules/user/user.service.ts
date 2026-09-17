import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '../../common/auth/jwt.strategy';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Upsert the local profile projection without replacing the auth source of truth. */
  async syncFromAuthUser(authUser: AuthUser): Promise<void> {
    let user = await this.userRepo.findOne({ where: { external_user_id: authUser.userId } });
    const displayName = authUser.username ?? authUser.email ?? null;

    if (!user) {
      user = this.userRepo.create({
        external_user_id: authUser.userId,
        email: authUser.email ?? null,
        username: authUser.username ?? null,
        display_name: displayName,
        avatar_url: authUser.avatar ?? null,
        last_seen_at: new Date(),
      });
    } else {
      if (authUser.email !== undefined) user.email = authUser.email ?? null;
      if (authUser.username !== undefined) {
        user.username = authUser.username ?? null;
        user.display_name = displayName;
      }
      if (authUser.avatar !== undefined) user.avatar_url = authUser.avatar ?? null;
      user.last_seen_at = new Date();
    }

    await this.userRepo.save(user);
  }
}
