import { uploadImportSchema, validateImportSchema, applyImportSchema } from '@almacen/contracts';
import { Controller, Post, Get, UseGuards, UseInterceptors, UploadedFile, Body, Req, Param, HttpCode, Query, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { mutationHeaders } from '../platform/http/operations.controller.js';
import { ExportService } from './export-service.js';
import { ImportService, type UploadFile } from './import-service.js';
class ApplicationDto {
  static schema = applyImportSchema;
  declare contentHash: string;
}
class EmptyDto {
  static schema = validateImportSchema;
}
class UploadDto {
  static schema = uploadImportSchema;
  declare kind: string;
  declare warehouseId?: string;
  [key: string]: unknown;
}
@Controller('imports')
@UseGuards(OperationsQueryGuard)
export class ImportController {
  constructor(private readonly imports: ImportService, private readonly exports: ExportService) {
  }
  @Post()
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20000000, files: 1, fields: 2, fieldSize: 1024 } }))
  async upload(
  @Req()
  req: Request,
  @Body()
  fields: UploadDto,
  @UploadedFile()
  file: UploadFile | undefined) {
    return { data: await this.imports.upload(mutationHeaders(req), fields, file) };
  }
  @Post(':id/application')
  async application(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: ApplicationDto,
  @Res({ passthrough: true })
  res: Response) {
    const result = await this.imports.application(mutationHeaders(req), id, body.contentHash);
    res.status(result.status);
    return { data: result.data };
  }
  @Post(':id/validation')
  @HttpCode(200)
  async validate(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  _body: EmptyDto) {
    void _body;
    return { data: await this.imports.validate(mutationHeaders(req), id) };
  }
  @Get('templates/:kind')
  async template(
  @Req()
  req: Request,
  @Param('kind')
  kind: string,
  @Query()
  query: Record<string, unknown>,
  @Res()
  res: Response) {
    const result = await this.exports.template(req.headers.cookie, kind, query.format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`);
    res.send(result.bytes);
  }
  @Get(':id/rows')
  async importRows(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Query()
  query: Record<string, unknown>) {
    return this.imports.rows(req.headers.cookie, id, query);
  }
  @Get(':id')
  async importDetail(
  @Req()
  req: Request,
  @Param('id')
  id: string) {
    return { data: await this.imports.detail(req.headers.cookie, id) };
  }
}
