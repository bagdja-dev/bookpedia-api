import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DisclaimerTemplate } from '../../entities/disclaimer-template.entity';
import { AuthModule } from '../../common/auth';
import { DisclaimerTemplatesController } from './disclaimer-templates.controller';
import { DisclaimerTemplatesService } from './disclaimer-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([DisclaimerTemplate]), AuthModule],
  controllers: [DisclaimerTemplatesController],
  providers: [DisclaimerTemplatesService],
  // Diexport supaya BooksModule bisa reuse untuk validasi disclaimerTemplateId.
  exports: [DisclaimerTemplatesService],
})
export class DisclaimerTemplatesModule {}
