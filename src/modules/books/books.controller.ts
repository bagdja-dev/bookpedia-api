import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, CurrentUser, PlatformId, type AuthUser } from '../../common/auth';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';

@ApiTags('Books')
@Controller('books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({
    summary: 'Buat Book baru di Library milik user login (Platform yang sedang diakses)',
    description:
      'library_id diambil otomatis dari Library milik user login DI PLATFORM INI (404 kalau user belum punya Library di sini). status SELALU mulai "draft", tidak bisa di-set saat create.',
  })
  @ApiOkResponse({ type: BookResponseDto, description: 'Book berhasil dibuat (status awal selalu "draft")' })
  async create(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Body() dto: CreateBookDto,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.create(user.userId, dto, platformId);
    return this.booksService.toResponseDto(book);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar semua Book milik Library user login di Platform ini (bukan semua Book di platform)' })
  @ApiOkResponse({ type: BookResponseDto, isArray: true, description: 'Daftar Book milik Library user login' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
  ): Promise<BookResponseDto[]> {
    const books = await this.booksService.findAllForOwner(user.userId, platformId);
    return this.booksService.toResponseDtos(books);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail 1 Book milik Library user login',
    description: '404 kalau Book tidak ditemukan ATAU bukan milik Library user login (tidak bocorkan keberadaannya).',
  })
  @ApiOkResponse({ type: BookResponseDto, description: 'Detail Book' })
  async findOne(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Param('id') id: string,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.findOneForOwner(user.userId, id, platformId);
    return this.booksService.toResponseDto(book);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Book milik Library user login',
    description: 'Semua field body opsional. status divalidasi salah satu dari draft/ongoing/completed.',
  })
  @ApiOkResponse({ type: BookResponseDto, description: 'Book terbaru setelah diupdate' })
  async update(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.update(user.userId, id, dto, platformId);
    return this.booksService.toResponseDto(book);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus Book milik Library user login (Chapter ikut terhapus via ON DELETE CASCADE)' })
  async remove(
    @CurrentUser() user: AuthUser,
    @PlatformId() platformId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.booksService.remove(user.userId, id, platformId);
  }
}
