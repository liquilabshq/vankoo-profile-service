import {
  Controller,
  Body,
  Param,
  HttpStatus,
  Res,
  Inject,
  Patch,
  Post,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { COMPANY_COMMAND_SERVICE } from '../../domain/services/company-command.service';
import { UploadCompanyRucResource } from './resources/upload-company-ruc.resource';
import { UploadCompanyLogoResource } from './resources/upload-company-logo.resource';
import { RequestUploadUrlResource } from './resources/request-upload-url.resource';
import { UploadCompanyRucCommandFromResourceAssembler } from './transform/upload-company-ruc-command-from-resource.assembler';
import { UploadCompanyLogoCommandFromResourceAssembler } from './transform/upload-company-logo-command-from-resource.assembler';
import { RequestCompanyRucUploadUrlCommandFromResourceAssembler } from './transform/request-company-ruc-upload-url-command-from-resource.assembler';
import { RequestCompanyLogoUploadUrlCommandFromResourceAssembler } from './transform/request-company-logo-upload-url-command-from-resource.assembler';
import { CompanyResourceFromEntityAssembler } from './transform/company-resource-from-entity.assembler';

import type { Response } from 'express';
import type { ICompanyCommandService } from '../../domain/services/company-command.service';
import { COMPANY_QUERY_SERVICE } from '../../domain/services/company-query.service';
import type { ICompanyQueryService } from '../../domain/services/company-query.service';
import { GetCompanyByIdQuery } from '../../domain/model/queries/get-company-by-id.query';
import { CompleteCompanyProfileResource } from './resources/complete-company-profile.resource';
import { CompleteCompanyProfileCommandFromResourceAssembler } from './transform/complete-company-profile-command-from-resource.assembler';

/** @author LiquiLabs */
@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(
    @Inject(COMPANY_COMMAND_SERVICE)
    private readonly companyCommandService: ICompanyCommandService,
    // Aquí inyectaremos el ICompanyQueryService más adelante
    @Inject(COMPANY_QUERY_SERVICE)
    private readonly companyQueryService: ICompanyQueryService,
  ) {}

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Completar datos del perfil de la Empresa (MYPE)' })
  @ApiParam({ name: 'id', description: 'UUID de la Empresa', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Perfil de empresa completado exitosamente',
  })
  async completeProfile(
    @Param('id') companyId: string,
    @Body() resource: CompleteCompanyProfileResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        CompleteCompanyProfileCommandFromResourceAssembler.toCommandFromResource(
          companyId,
          resource,
        );

      const company =
        await this.companyCommandService.handleCompleteProfile(command);

      const companyResource =
        CompanyResourceFromEntityAssembler.toResourceFromEntity(company);

      return res.status(HttpStatus.OK).json({
        message: 'Perfil de empresa completado exitosamente',
        company: companyResource,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una Empresa por su ID' })
  @ApiParam({ name: 'id', description: 'UUID de la Empresa', type: 'string' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async getCompanyById(@Param('id') companyId: string, @Res() res: Response) {
    try {
      const query = new GetCompanyByIdQuery(companyId);
      const company =
        await this.companyQueryService.handleGetCompanyById(query);

      if (!company) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: `La empresa con ID ${companyId} no existe.` });
      }

      const companyResource =
        CompanyResourceFromEntityAssembler.toResourceFromEntity(company);
      return res.status(HttpStatus.OK).json(companyResource);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      return res.status(HttpStatus.BAD_REQUEST).json({ message: errorMessage });
    }
  }

  @Post(':id/ruc/upload-url')
  @ApiOperation({
    summary:
      'Solicitar una URL prefirmada para subir el RUC directamente a MinIO',
  })
  @ApiParam({ name: 'id', description: 'UUID de la Empresa', type: 'string' })
  @ApiResponse({ status: 200, description: 'URL prefirmada generada' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async requestRucUploadUrl(
    @Param('id') companyId: string,
    @Body() resource: RequestUploadUrlResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        RequestCompanyRucUploadUrlCommandFromResourceAssembler.toCommandFromResource(
          companyId,
          resource,
        );
      const result =
        await this.companyCommandService.handleRequestRucUploadUrl(command);

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }

  @Patch(':id/ruc')
  @ApiOperation({ summary: 'Subir documento RUC de la Empresa' })
  @ApiParam({ name: 'id', description: 'UUID de la Empresa', type: 'string' })
  @ApiResponse({ status: 200, description: 'RUC subido exitosamente' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async uploadRuc(
    @Param('id') companyId: string,
    @Body() resource: UploadCompanyRucResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        UploadCompanyRucCommandFromResourceAssembler.toCommandFromResource(
          companyId,
          resource,
        );
      const company = await this.companyCommandService.handleUploadRuc(command);
      const companyResource =
        CompanyResourceFromEntityAssembler.toResourceFromEntity(company);

      return res
        .status(HttpStatus.OK)
        .json({ message: 'RUC subido exitosamente', company: companyResource });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }

  @Post(':id/logo/upload-url')
  @ApiOperation({
    summary:
      'Solicitar una URL prefirmada para subir el logo directamente a MinIO',
  })
  @ApiParam({ name: 'id', description: 'UUID de la Empresa', type: 'string' })
  @ApiResponse({ status: 200, description: 'URL prefirmada generada' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async requestLogoUploadUrl(
    @Param('id') companyId: string,
    @Body() resource: RequestUploadUrlResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        RequestCompanyLogoUploadUrlCommandFromResourceAssembler.toCommandFromResource(
          companyId,
          resource,
        );
      const result =
        await this.companyCommandService.handleRequestLogoUploadUrl(command);

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }

  @Patch(':id/logo')
  @ApiOperation({ summary: 'Actualizar logo de la Empresa' })
  @ApiParam({ name: 'id', description: 'UUID de la Empresa', type: 'string' })
  @ApiResponse({ status: 200, description: 'Logo actualizado' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async uploadLogo(
    @Param('id') companyId: string,
    @Body() resource: UploadCompanyLogoResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        UploadCompanyLogoCommandFromResourceAssembler.toCommandFromResource(
          companyId,
          resource,
        );
      const company =
        await this.companyCommandService.handleUploadLogo(command);
      const companyResource =
        CompanyResourceFromEntityAssembler.toResourceFromEntity(company);

      return res.status(HttpStatus.OK).json({
        message: 'Logo actualizado exitosamente',
        company: companyResource,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }
}
