import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../common/auth';
import { Notification } from '../../entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationEventBroadcasterService } from './notification-event-broadcaster.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationEventBroadcasterService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
