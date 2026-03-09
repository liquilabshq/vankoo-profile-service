import {
  Controller,
  Body,
  Param,
  HttpStatus,
  Res,
  Inject,
  Patch,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { INVESTOR_COMMAND_SERVICE } from '../../domain/services/investor-command.service';
import { UploadInvestorDniResource } from './resources/upload-investor-dni.resource';
import { UploadInvestorPhotoResource } from './resources/upload-investor-photo.resource';
import { UploadInvestorDniCommandFromResourceAssembler } from './transform/upload-investor-dni-command-from-resource.assembler';
import { UploadInvestorPhotoCommandFromResourceAssembler } from './transform/upload-investor-photo-command-from-resource.assembler';
import { InvestorResourceFromEntityAssembler } from './transform/investor-resource-from-entity.assembler';

// Importaciones para tipado estricto (soluciona el unsafe-assignment)
import { UploadInvestorDniCommand } from '../../domain/model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../../domain/model/commands/upload-investor-photo.command';
import type { Response } from 'express';
import type { IInvestorCommandService } from '../../domain/services/investor-command.service';
import { INVESTOR_QUERY_SERVICE } from '../../domain/services/investor-query.service';
import type { IInvestorQueryService } from '../../domain/services/investor-query.service';
import { GetInvestorByIdQuery } from '../../domain/model/queries/get-investor-by-id.query';

/** @author LiquiLabs */
@ApiTags('Investors')
@Controller('investors')
export class InvestorsController {
  constructor(
    @Inject(INVESTOR_COMMAND_SERVICE)
    private readonly investorCommandService: IInvestorCommandService,

    @Inject(INVESTOR_QUERY_SERVICE)
    private readonly investorQueryService: IInvestorQueryService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un Inversor por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del Inversor', type: 'string' })
  @ApiResponse({ status: 200, description: 'Inversor encontrado' })
  @ApiResponse({ status: 404, description: 'Inversor no encontrado' })
  async getInvestorById(@Param('id') investorId: string, @Res() res: Response) {
    try {
      const query = new GetInvestorByIdQuery(investorId);
      const investor =
        await this.investorQueryService.handleGetInvestorById(query);

      if (!investor) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: `El inversor con ID ${investorId} no existe.` });
      }

      // Reutilizamos el Assembler que ya teníamos
      const investorResource =
        InvestorResourceFromEntityAssembler.toResourceFromEntity(investor);

      return res.status(HttpStatus.OK).json(investorResource);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      return res.status(HttpStatus.BAD_REQUEST).json({ message: errorMessage });
    }
  }

  @Patch(':id/dni')
  @ApiOperation({ summary: 'Subir documento DNI del Inversor' })
  @ApiParam({ name: 'id', description: 'UUID del Inversor', type: 'string' }) // Ahora sí usamos ApiParam
  @ApiResponse({ status: 200, description: 'DNI subido exitosamente' })
  async uploadDni(
    @Param('id') investorId: string,
    @Body() resource: UploadInvestorDniResource,
    @Res() res: Response,
  ) {
    try {
      // Tipado fuerte para evitar que ESLint se queje
      const command: UploadInvestorDniCommand =
        UploadInvestorDniCommandFromResourceAssembler.toCommandFromResource(
          investorId,
          resource,
        );

      const investor =
        await this.investorCommandService.handleUploadDni(command);

      const investorResource =
        InvestorResourceFromEntityAssembler.toResourceFromEntity(investor);

      return res.status(HttpStatus.OK).json({
        message: 'DNI subido exitosamente',
        investor: investorResource,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrado')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }

  @Patch(':id/photo')
  @ApiOperation({ summary: 'Actualizar foto del Inversor' })
  @ApiParam({ name: 'id', description: 'UUID del Inversor', type: 'string' })
  @ApiResponse({ status: 200, description: 'Foto actualizada' })
  async uploadPhoto(
    @Param('id') investorId: string,
    @Body() resource: UploadInvestorPhotoResource,
    @Res() res: Response,
  ) {
    try {
      // Tipado fuerte
      const command: UploadInvestorPhotoCommand =
        UploadInvestorPhotoCommandFromResourceAssembler.toCommandFromResource(
          investorId,
          resource,
        );

      const investor =
        await this.investorCommandService.handleUploadPhoto(command);

      const investorResource =
        InvestorResourceFromEntityAssembler.toResourceFromEntity(investor);

      return res.status(HttpStatus.OK).json({
        message: 'Foto actualizada exitosamente',
        investor: investorResource,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = errorMessage.includes('no encontrado')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message: errorMessage });
    }
  }
}
