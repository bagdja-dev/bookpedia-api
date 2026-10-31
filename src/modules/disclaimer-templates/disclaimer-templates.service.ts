import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DisclaimerTemplate } from '../../entities/disclaimer-template.entity';
import { CreateDisclaimerTemplateDto } from './dto/create-disclaimer-template.dto';
import { UpdateDisclaimerTemplateDto } from './dto/update-disclaimer-template.dto';
import { DisclaimerTemplateResponseDto, DeletedResponseDto } from './dto/disclaimer-template-response.dto';

@Injectable()
export class DisclaimerTemplatesService {
  constructor(
    @InjectRepository(DisclaimerTemplate)
    private readonly templateRepo: Repository<DisclaimerTemplate>,
  ) {}

  /**
   * Daftar template disclaimer milik satu Platform, urut `nama` ASC.
   * Hanya template `is_active = true` yang ditampilkan ke penulis di form
   * Book (lihat `findActiveByPlatform`).
   */
  async findAllByPlatform(platformId: string): Promise<DisclaimerTemplate[]> {
    return this.templateRepo.find({ where: { platform_id: platformId }, order: { nama: 'ASC' } });
  }

  /** Hanya template aktif — dipakai dropdown pilihan penulis di form Book Studio. */
  async findActiveByPlatform(platformId: string): Promise<DisclaimerTemplate[]> {
    return this.templateRepo.find({ where: { platform_id: platformId, is_active: true }, order: { nama: 'ASC' } });
  }

  async findById(id: string): Promise<DisclaimerTemplate | null> {
    return this.templateRepo.findOne({ where: { id } });
  }

  private async findEntityOrThrow(platformId: string, id: string): Promise<DisclaimerTemplate> {
    const template = await this.templateRepo.findOne({ where: { id, platform_id: platformId } });
    if (!template) throw new NotFoundException('Disclaimer template not found');
    return template;
  }

  async create(platformId: string, dto: CreateDisclaimerTemplateDto): Promise<DisclaimerTemplateResponseDto> {
    const existingNama = await this.templateRepo.findOne({ where: { platform_id: platformId, nama: dto.nama } });
    if (existingNama) {
      throw new ConflictException('A disclaimer template with this name already exists in this platform');
    }

    const template = this.templateRepo.create({
      platform_id: platformId,
      nama: dto.nama,
      content: dto.content,
      is_active: dto.isActive ?? true,
    });
    const saved = await this.templateRepo.save(template);
    return this.toResponseDto(saved);
  }

  async update(platformId: string, id: string, dto: UpdateDisclaimerTemplateDto): Promise<DisclaimerTemplateResponseDto> {
    const template = await this.findEntityOrThrow(platformId, id);

    if (dto.nama !== undefined && dto.nama !== template.nama) {
      const existing = await this.templateRepo.findOne({ where: { platform_id: platformId, nama: dto.nama } });
      if (existing) throw new ConflictException('A disclaimer template with this name already exists in this platform');
      template.nama = dto.nama;
    }
    if (dto.content !== undefined) template.content = dto.content;
    if (dto.isActive !== undefined) template.is_active = dto.isActive;

    await this.templateRepo.save(template);
    return this.toResponseDto(template);
  }

  async remove(platformId: string, id: string): Promise<DeletedResponseDto> {
    const template = await this.findEntityOrThrow(platformId, id);
    await this.templateRepo.remove(template);
    return { deleted: true };
  }

  toResponseDto(template: DisclaimerTemplate): DisclaimerTemplateResponseDto {
    return {
      id: template.id,
      platformId: template.platform_id,
      nama: template.nama,
      content: template.content,
      isActive: template.is_active,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  }
}
