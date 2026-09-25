import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type AuthUser } from '../../common/auth';
import { AddBookToCollectionDto } from './dto/add-book-to-collection.dto';
import { CollectionBookItemDto } from './dto/collection-book-item.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionBookDto } from './dto/update-collection-book.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionsService } from './collections.service';
import { BookCollection } from '../../entities/book-collection.entity';
import { CollectionBook } from '../../entities/collection-book.entity';

@ApiTags('Collections')
@Controller('collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all collections for the authenticated user' })
  async list(@CurrentUser() user: AuthUser): Promise<BookCollection[]> {
    return this.collectionsService.listForUser(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiOkResponse({ type: BookCollection })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCollectionDto): Promise<BookCollection> {
    return this.collectionsService.create(user, dto.name, dto.description ?? null, dto.isPublic ?? false);
  }

  @Get(':collectionId')
  @ApiOperation({ summary: 'Get one collection by id' })
  @ApiOkResponse({ type: BookCollection })
  async findOne(@CurrentUser() user: AuthUser, @Param('collectionId') collectionId: string): Promise<BookCollection> {
    return this.collectionsService.findOne(user, collectionId);
  }

  @Patch(':collectionId')
  @ApiOperation({ summary: 'Update a collection' })
  @ApiOkResponse({ type: BookCollection })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('collectionId') collectionId: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<BookCollection> {
    return this.collectionsService.update(user, collectionId, {
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic,
    });
  }

  @Delete(':collectionId')
  @ApiOperation({ summary: 'Delete a collection' })
  async remove(@CurrentUser() user: AuthUser, @Param('collectionId') collectionId: string): Promise<void> {
    await this.collectionsService.remove(user, collectionId);
  }

  @Get(':collectionId/books')
  @ApiOperation({ summary: 'List books inside a collection' })
  @ApiOkResponse({ type: CollectionBookItemDto, isArray: true })
  async listBooks(@CurrentUser() user: AuthUser, @Param('collectionId') collectionId: string): Promise<CollectionBookItemDto[]> {
    return this.collectionsService.listBooks(user, collectionId);
  }

  @Post(':collectionId/books')
  @ApiOperation({ summary: 'Add a book to a collection' })
  @ApiOkResponse({ type: CollectionBook })
  async addBook(
    @CurrentUser() user: AuthUser,
    @Param('collectionId') collectionId: string,
    @Body() dto: AddBookToCollectionDto,
  ): Promise<CollectionBook> {
    return this.collectionsService.addBook(user, collectionId, {
      bookId: dto.bookId,
      notifyOnAuthorUpdate: dto.notifyOnAuthorUpdate,
      note: dto.note,
      status: dto.status,
    });
  }

  @Delete(':collectionId/books/:bookId')
  @ApiOperation({ summary: 'Remove a book from a collection' })
  async removeBook(
    @CurrentUser() user: AuthUser,
    @Param('collectionId') collectionId: string,
    @Param('bookId') bookId: string,
  ): Promise<void> {
    await this.collectionsService.removeBook(user, collectionId, bookId);
  }

  @Patch(':collectionId/books/:bookId')
  @ApiOperation({ summary: 'Update a collection item' })
  @ApiOkResponse({ type: CollectionBook })
  async updateBook(
    @CurrentUser() user: AuthUser,
    @Param('collectionId') collectionId: string,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateCollectionBookDto,
  ): Promise<CollectionBook> {
    return this.collectionsService.updateBook(user, collectionId, bookId, {
      notifyOnAuthorUpdate: dto.notifyOnAuthorUpdate,
      note: dto.note,
      status: dto.status,
    });
  }
}
