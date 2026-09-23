import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import type { AuthUser } from '../../common/auth';
import { Book } from '../../entities/book.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Library } from '../../entities/library.entity';
import { ChapterLike } from '../../entities/chapter-like.entity';
import { Platform } from '../../entities/platform.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformsService } from '../platforms/platforms.service';
import { ToggleLikeResponseDto } from './dto/toggle-like-response.dto';

/**
 * Fase 8 (14 Sep 2026) — Like binary per Chapter, terpisah dari Rating
 * bintang (`RatingsService`). Toggle (bukan idempotent "like"/"unlike"
 * terpisah) supaya client cuma perlu 1 endpoint untuk tombol hati.
 * Lihat plan/bookpedia/overview.md §14.
 */
@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(ChapterLike)
    private readonly likeRepo: Repository<ChapterLike>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    private readonly platformsService: PlatformsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  private async getPublishedChapterOrThrow(chapterId: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id: chapterId, status: 'published' } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  private async getPlatformOfChapterOrThrow(chapter: Chapter): Promise<{ book: Book; platform: Platform }> {
    const book = await this.bookRepo.findOne({ where: { id: chapter.book_id } });
    if (!book || !book.published_at) {
      throw new NotFoundException('Chapter not found');
    }
    const platform = book.platform_id ? await this.platformsService.findById(book.platform_id) : null;
    if (!platform) {
      throw new NotFoundException('Chapter not found');
    }
    return { book, platform };
  }

  async findStatus(userId: string, chapterId: string): Promise<ToggleLikeResponseDto> {
    const chapter = await this.getPublishedChapterOrThrow(chapterId);
    const existing = await this.likeRepo.findOne({ where: { user_id: userId, chapter_id: chapter.id } });
    return { liked: !!existing, likeCount: chapter.like_count };
  }

  /**
   * Insert+increment (belum like) atau delete+decrement (sudah like) dalam
   * satu transaction — atomik terhadap `chapters.like_count`/`books.like_count`,
   * bukan read-then-write. `platform.enable_like` divalidasi dulu (pertahanan
   * berlapis, pola sama `RatingsService`).
   */
  async toggle(user: AuthUser, chapterId: string): Promise<ToggleLikeResponseDto> {
    const chapter = await this.getPublishedChapterOrThrow(chapterId);
    const { book, platform } = await this.getPlatformOfChapterOrThrow(chapter);

    if (!platform.enable_like) {
      throw new BadRequestException('Like dinonaktifkan untuk Platform ini');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const likeRepo = manager.getRepository(ChapterLike);
      const chapterRepo = manager.getRepository(Chapter);
      const bookRepo = manager.getRepository(Book);

      const existing = await likeRepo.findOne({ where: { user_id: user.userId, chapter_id: chapter.id } });

      let liked: boolean;
      if (existing) {
        await likeRepo.delete({ id: existing.id });
        await chapterRepo.decrement({ id: chapter.id }, 'like_count', 1);
        await bookRepo.decrement({ id: book.id }, 'like_count', 1);
        liked = false;
      } else {
        await likeRepo.save(likeRepo.create({ user_id: user.userId, chapter_id: chapter.id }));
        await chapterRepo.increment({ id: chapter.id }, 'like_count', 1);
        await bookRepo.increment({ id: book.id }, 'like_count', 1);
        liked = true;
      }

      const updated = await chapterRepo.findOneOrFail({ where: { id: chapter.id } });
      return { liked, likeCount: updated.like_count };
    });

    // Notifikasi cuma saat LIKE (bukan unlike) — konsisten dengan comment
    // notification (hanya dipicu aksi positif, bukan setiap perubahan state).
    if (result.liked) {
      void this.notifyChapterLiked(book, chapter, user).catch(() => undefined);
    }

    return result;
  }

  /** Ditargetkan ke owner Library, self-like (owner nge-like karyanya sendiri) sengaja diabaikan. */
  private async notifyChapterLiked(book: Book, chapter: Chapter, actor: AuthUser): Promise<void> {
    const library = await this.libraryRepo.findOne({ where: { id: book.library_id } });
    if (!library || library.owner_user_id === actor.userId) return;

    const actorName = actor.username ?? actor.email ?? 'Seseorang';

    await this.notificationsService.create({
      userId: library.owner_user_id,
      type: 'chapter.liked',
      title: 'Ada yang menyukai chapter Anda',
      message: `${actorName} menyukai ${chapter.judul} dari ${book.judul}`,
      severity: 'info',
      actionLabel: 'Lihat chapter',
      actionUrl: `/book/${encodeURIComponent(book.slug)}/chapter/${chapter.order_index}`,
      entityType: 'chapter',
      entityId: chapter.id,
    });
  }
}
