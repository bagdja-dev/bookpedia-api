import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { AuthUser } from '../../common/auth';
import { Book } from '../../entities/book.entity';
import { BookCollection } from '../../entities/book-collection.entity';
import { BookTag } from '../../entities/book-tag.entity';
import { CollectionBook, type CollectionBookStatus } from '../../entities/collection-book.entity';
import { Library } from '../../entities/library.entity';
import { Genre } from '../../entities/genre.entity';
import { Category } from '../../entities/category.entity';
import { Tag } from '../../entities/tag.entity';
import { CollectionBookItemDto } from './dto/collection-book-item.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(BookCollection)
    private readonly collectionRepo: Repository<BookCollection>,
    @InjectRepository(CollectionBook)
    private readonly collectionBookRepo: Repository<CollectionBook>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(BookTag)
    private readonly bookTagRepo: Repository<BookTag>,
  ) {}

  private async assertOwnedCollection(userId: string, collectionId: string): Promise<BookCollection> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId, user_id: userId } });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  private async assertBookExists(bookId: string): Promise<Book> {
    const book = await this.bookRepo.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async listForUser(user: AuthUser): Promise<BookCollection[]> {
    return this.collectionRepo.find({
      where: { user_id: user.userId },
      order: { created_at: 'DESC' },
    });
  }

  async create(user: AuthUser, name: string, description?: string | null, isPublic = false): Promise<BookCollection> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Collection name is required');
    }

    const existing = await this.collectionRepo.findOne({ where: { user_id: user.userId, name: trimmedName } });
    if (existing) {
      throw new BadRequestException('Collection name already exists');
    }

    const collection = this.collectionRepo.create({
      user_id: user.userId,
      name: trimmedName,
      description: description?.trim() || null,
      is_public: isPublic,
    });

    return this.collectionRepo.save(collection);
  }

  async findOne(user: AuthUser, collectionId: string): Promise<BookCollection> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId, user_id: user.userId } });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  async update(user: AuthUser, collectionId: string, input: { name?: string; description?: string | null; isPublic?: boolean }): Promise<BookCollection> {
    const collection = await this.assertOwnedCollection(user.userId, collectionId);

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Collection name is required');
      }

      const duplicate = await this.collectionRepo.findOne({ where: { user_id: user.userId, name: trimmedName } });
      if (duplicate && duplicate.id !== collection.id) {
        throw new BadRequestException('Collection name already exists');
      }
      collection.name = trimmedName;
    }

    if (input.description !== undefined) {
      collection.description = input.description?.trim() || null;
    }

    if (input.isPublic !== undefined) {
      collection.is_public = input.isPublic;
    }

    return this.collectionRepo.save(collection);
  }

  async remove(user: AuthUser, collectionId: string): Promise<void> {
    const collection = await this.assertOwnedCollection(user.userId, collectionId);
    await this.collectionRepo.remove(collection);
  }

  async listBooks(user: AuthUser, collectionId: string): Promise<CollectionBookItemDto[]> {
    await this.assertOwnedCollection(user.userId, collectionId);
    const items = await this.collectionBookRepo.find({
      where: { collection_id: collectionId },
      order: { added_at: 'DESC' },
    });

    if (items.length === 0) {
      return [];
    }

    const bookIds = [...new Set(items.map((item) => item.book_id))];
    const books = await this.bookRepo.find({
      where: { id: In(bookIds) },
      relations: ['genre', 'category'],
    });
    const libraryIds = [...new Set(books.map((book) => book.library_id))];
    const genreIds = [...new Set(books.map((book) => book.genre_id).filter((value): value is string => !!value))];
    const categoryIds = [...new Set(books.map((book) => book.category_id).filter((value): value is string => !!value))];

    const [libraries, bookTagRows, genres, categories] = await Promise.all([
      this.libraryRepo.find({ where: { id: In(libraryIds) } }),
      this.bookTagRepo.find({ where: { book_id: In(bookIds) }, relations: ['tag'] }),
      this.genreRepo.find({ where: { id: In(genreIds) } }),
      this.categoryRepo.find({ where: { id: In(categoryIds) } }),
    ]);

    const bookById = new Map(books.map((book) => [book.id, book]));
    const libraryById = new Map(libraries.map((library) => [library.id, library]));
    const genreById = new Map(genres.map((genre) => [genre.id, genre]));
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const tagsByBookId = new Map<string, Tag[]>();
    for (const row of bookTagRows) {
      if (!row.tag) continue;
      const list = tagsByBookId.get(row.book_id) ?? [];
      list.push(row.tag);
      tagsByBookId.set(row.book_id, list);
    }

    return items
      .map((item) => {
        const book = bookById.get(item.book_id);
        if (!book) return null;

        const library = libraryById.get(book.library_id);
        const genre = book.genre_id ? genreById.get(book.genre_id) ?? null : null;
        const category = book.category_id ? categoryById.get(book.category_id) ?? null : null;
        const tags = tagsByBookId.get(book.id) ?? [];

        return {
          id: item.id,
          collectionId: item.collection_id,
          bookId: item.book_id,
          notifyOnAuthorUpdate: item.notify_on_author_update,
          note: item.note,
          status: item.status,
          addedAt: item.added_at,
          book: {
            id: book.id,
            judul: book.judul,
            slug: book.slug,
            sinopsis: book.sinopsis,
            genre: genre ? { id: genre.id, platformId: genre.platform_id, nama: genre.nama, slug: genre.slug } : null,
            category: category ? { id: category.id, platformId: category.platform_id, nama: category.nama, slug: category.slug } : null,
            tags: tags.map((tag) => ({ id: tag.id, platformId: tag.platform_id, nama: tag.nama, slug: tag.slug })),
            series: null,
            coverUrl: book.cover_url,
            status: book.status,
            latestChapterTitle: null,
            bookType: book.book_type,
            originalAuthor: book.original_author,
            library: { nama: library?.nama ?? '', slug: library?.slug ?? '' },
            viewCount: book.view_count,
            ratingAverage: Number(book.rating_average),
            ratingCount: book.rating_count,
            likeCount: book.like_count,
            uniqueReaderCount: 0,
            commentCount: 0,
          },
        } satisfies CollectionBookItemDto;
      })
      .filter((item): item is CollectionBookItemDto => item !== null);
  }

  async addBook(
    user: AuthUser,
    collectionId: string,
    input: {
      bookId: string;
      notifyOnAuthorUpdate?: boolean;
      note?: string | null;
      status?: CollectionBookStatus;
    },
  ): Promise<CollectionBook> {
    await this.assertOwnedCollection(user.userId, collectionId);
    await this.assertBookExists(input.bookId);

    const existing = await this.collectionBookRepo.findOne({ where: { collection_id: collectionId, book_id: input.bookId } });
    if (existing) {
      throw new BadRequestException('Book is already in this collection');
    }

    const item = this.collectionBookRepo.create({
      collection_id: collectionId,
      book_id: input.bookId,
      notify_on_author_update: input.notifyOnAuthorUpdate ?? true,
      note: input.note?.trim() || null,
      status: input.status ?? 'saved',
    });

    return this.collectionBookRepo.save(item);
  }

  async removeBook(user: AuthUser, collectionId: string, bookId: string): Promise<void> {
    await this.assertOwnedCollection(user.userId, collectionId);
    const item = await this.collectionBookRepo.findOne({ where: { collection_id: collectionId, book_id: bookId } });
    if (!item) {
      throw new NotFoundException('Book not found in this collection');
    }
    await this.collectionBookRepo.remove(item);
  }

  async updateBook(
    user: AuthUser,
    collectionId: string,
    bookId: string,
    input: {
      notifyOnAuthorUpdate?: boolean;
      note?: string | null;
      status?: CollectionBookStatus;
    },
  ): Promise<CollectionBook> {
    await this.assertOwnedCollection(user.userId, collectionId);
    const item = await this.collectionBookRepo.findOne({ where: { collection_id: collectionId, book_id: bookId } });
    if (!item) {
      throw new NotFoundException('Book not found in this collection');
    }

    if (input.notifyOnAuthorUpdate !== undefined) {
      item.notify_on_author_update = input.notifyOnAuthorUpdate;
    }
    if (input.note !== undefined) {
      item.note = input.note?.trim() || null;
    }
    if (input.status !== undefined) {
      item.status = input.status;
    }

    return this.collectionBookRepo.save(item);
  }
}
