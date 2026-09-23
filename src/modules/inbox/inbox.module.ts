import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../common/auth';
import { ChatConversation } from '../../entities/chat-conversation.entity';
import { Library } from '../../entities/library.entity';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatConversation, Library]), AuthModule, NotificationsModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
