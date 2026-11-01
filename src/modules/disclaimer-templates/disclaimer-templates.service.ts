import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

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

  /* ================= Platform level (Admin) ================= */

  async findAllByPlatform(platformId: string): Promise<DisclaimerTemplate[]> {
    return this.templateRepo.find({ where: { platform_id: platformId }, order: { nama: 'ASC' } });
  }

  async findActiveByPlatform(platformId: string): Promise<DisclaimerTemplate[]> {
    return this.templateRepo.find({
      where: { platform_id: platformId, is_active: true },
      order: { nama: 'ASC' },
    });
  }

  async findDefaultByPlatform(platformId: string): Promise<DisclaimerTemplate | null> {
    return this.templateRepo.findOne({
      where: { platform_id: platformId, is_active: true, is_default: true },
    });
  }

  private async findEntityByPlatform(platformId: string, id: string): Promise<DisclaimerTemplate> {
    const template = await this.templateRepo.findOne({ where: { id, platform_id: platformId } });
    if (!template) throw new NotFoundException('Disclaimer template not found');
    return template;
  }

  async createByPlatform(
    platformId: string,
    dto: CreateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    const existingNama = await this.templateRepo.findOne({
      where: { platform_id: platformId, nama: dto.nama },
    });
    if (existingNama) {
      throw new ConflictException('A disclaimer template with this name already exists in this platform');
    }

    const template = this.templateRepo.create({
      platform_id: platformId,
      nama: dto.nama,
      content: dto.content,
      is_active: dto.isActive ?? true,
      is_default: dto.isDefault ?? false,
    });
    const saved = await this.templateRepo.save(template);

    if (saved.is_default) {
      await this.templateRepo.update(
        { platform_id: platformId, id: Not(saved.id) },
        { is_default: false },
      );
    }

    return this.toResponseDto(saved);
  }

  async updateByPlatform(
    platformId: string,
    id: string,
    dto: UpdateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    const template = await this.findEntityByPlatform(platformId, id);

    if (dto.nama !== undefined && dto.nama !== template.nama) {
      const existing = await this.templateRepo.findOne({
        where: { platform_id: platformId, nama: dto.nama },
      });
      if (existing) {
        throw new ConflictException('A disclaimer template with this name already exists in this platform');
      }
      template.nama = dto.nama;
    }
    if (dto.content !== undefined) template.content = dto.content;
    if (dto.isActive !== undefined) template.is_active = dto.isActive;
    if (dto.isDefault !== undefined) template.is_default = dto.isDefault;

    await this.templateRepo.save(template);

    if (template.is_default) {
      await this.templateRepo.update(
        { platform_id: template.platform_id, id: Not(template.id) },
        { is_default: false },
      );
    }

    return this.toResponseDto(template);
  }

  async removeByPlatform(platformId: string, id: string): Promise<DeletedResponseDto> {
    const template = await this.findEntityByPlatform(platformId, id);
    await this.templateRepo.remove(template);
    return { deleted: true };
  }

  /* ================= Library/Studio level (Owner) ================= */

  async findAllByLibrary(libraryId: string): Promise<DisclaimerTemplate[]> {
    return this.templateRepo.find({ where: { library_id: libraryId }, order: { nama: 'ASC' } });
  }

  async findActiveByLibrary(libraryId: string): Promise<DisclaimerTemplate[]> {
    return this.templateRepo.find({
      where: { library_id: libraryId, is_active: true },
      order: { nama: 'ASC' },
    });
  }

  async findDefaultByLibrary(libraryId: string): Promise<DisclaimerTemplate | null> {
    return this.templateRepo.findOne({
      where: { library_id: libraryId, is_active: true, is_default: true },
    });
  }

  private async findEntityByLibrary(libraryId: string, id: string): Promise<DisclaimerTemplate> {
    const template = await this.templateRepo.findOne({ where: { id, library_id: libraryId } });
    if (!template) throw new NotFoundException('Disclaimer template not found');
    return template;
  }

  async createByLibrary(
    libraryId: string,
    dto: CreateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    const existingNama = await this.templateRepo.findOne({
      where: { library_id: libraryId, nama: dto.nama },
    });
    if (existingNama) {
      throw new ConflictException('A disclaimer template with this name already exists in this studio');
    }

    const template = this.templateRepo.create({
      library_id: libraryId,
      nama: dto.nama,
      content: dto.content,
      is_active: dto.isActive ?? true,
      is_default: dto.isDefault ?? false,
    });
    const saved = await this.templateRepo.save(template);

    if (saved.is_default) {
      await this.templateRepo.update(
        { library_id: libraryId, id: Not(saved.id) },
        { is_default: false },
      );
    }

    return this.toResponseDto(saved);
  }

  async updateByLibrary(
    libraryId: string,
    id: string,
    dto: UpdateDisclaimerTemplateDto,
  ): Promise<DisclaimerTemplateResponseDto> {
    const template = await this.findEntityByLibrary(libraryId, id);

    if (dto.nama !== undefined && dto.nama !== template.nama) {
      const existing = await this.templateRepo.findOne({
        where: { library_id: libraryId, nama: dto.nama },
      });
      if (existing) {
        throw new ConflictException('A disclaimer template with this name already exists in this studio');
      }
      template.nama = dto.nama;
    }
    if (dto.content !== undefined) template.content = dto.content;
    if (dto.isActive !== undefined) template.is_active = dto.isActive;
    if (dto.isDefault !== undefined) template.is_default = dto.isDefault;

    await this.templateRepo.save(template);

    if (template.is_default) {
      await this.templateRepo.update(
        { library_id: template.library_id, id: Not(template.id) },
        { is_default: false },
      );
    }

    return this.toResponseDto(template);
  }

  async removeByLibrary(libraryId: string, id: string): Promise<DeletedResponseDto> {
    const template = await this.findEntityByLibrary(libraryId, id);
    await this.templateRepo.remove(template);
    return { deleted: true };
  }

  /* ================= Shared ================= */

  async findById(id: string): Promise<DisclaimerTemplate | null> {
    return this.templateRepo.findOne({ where: { id } });
  }

  toResponseDto(template: DisclaimerTemplate): DisclaimerTemplateResponseDto {
    return {
      id: template.id,
      platformId: template.platform_id,
      libraryId: template.library_id,
      nama: template.nama,
      content: template.content,
      isActive: template.is_active,
      isDefault: template.is_default,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  }
}
