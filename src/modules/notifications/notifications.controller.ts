import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type AuthUser } from '../../common/auth';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the authenticated user' })
  async list(@CurrentUser() user: AuthUser, @Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.listForUser(
      user.userId,
      query.limit ?? 20,
      query.offset ?? 0,
      query.unread,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({ schema: { example: { count: 3 } } })
  async unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.unreadCount(user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('notificationId', new ParseUUIDPipe()) notificationId: string,
  ) {
    return this.notificationsService.markRead(user.userId, notificationId);
  }
}
