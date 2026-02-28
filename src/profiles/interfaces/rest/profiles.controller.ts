// Importación de valores (cosas que existen en JavaScript)
import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  Res,
  Inject,
} from '@nestjs/common';
import { PROFILE_COMMAND_SERVICE } from '../../domain/services/profile-command.service';
import { UploadDniResource } from './resources/upload-dni.resource';
import { UploadDniCommandFromResourceAssembler } from './transform/upload-dni-command-from-resource.assembler';
import { ProfileResourceFromEntityAssembler } from './transform/profile-resource-from-entity.assembler';

// Importación exclusiva de tipos (solo existen en TypeScript)
import type { Response } from 'express';
import type { IProfileCommandService } from '../../domain/services/profile-command.service';
import { UploadPhotoResource } from './resources/upload-photo.resource';
import { UploadPhotoCommandFromResourceAssembler } from './transform/upload-photo-command-from-resource.assembler';
import { UploadRucResource } from './resources/upload-ruc.resource';
import { UploadRucCommandFromResourceAssembler } from './transform/upload-ruc-command-from-resource.assembler';
import { version } from 'eslint-plugin-prettier';

/**
 * @author LiquiLabs
 */
@Controller('api/v1/profiles')
export class ProfilesController {
  constructor(
    @Inject(PROFILE_COMMAND_SERVICE)
    private readonly profileCommandService: IProfileCommandService,
  ) {}

  @Post(':id/dni')
  async uploadDni(
    @Param('id') profileId: string,
    @Body() resource: UploadDniResource,
    @Res() res: Response,
  ) {
    try {
      // 1. Convertir la petición REST (Resource) en un Comando de Dominio
      const command =
        UploadDniCommandFromResourceAssembler.toCommandFromResource(
          profileId,
          resource,
        );

      // 2. Ejecutar el caso de uso a través del Command Service
      const profile = await this.profileCommandService.handleUploadDni(command);

      // 3. Convertir el resultado del Dominio (ProfileAggregate) nuevamente a un Recurso REST para la salida
      const profileResource =
        ProfileResourceFromEntityAssembler.toResourceFromEntity(profile);

      // 4. Retornar la respuesta HTTP
      return res.status(HttpStatus.OK).json({
        message: 'DNI subido exitosamente',
        profile: profileResource,
      });
    } catch (error: unknown) {
      // Verificamos si realmente es un objeto de tipo Error
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado';

      return res.status(HttpStatus.BAD_REQUEST).json({ message: errorMessage });
    }
  }

  @Post(':id/ruc')
  async uploadRuc(
    @Param('id') profileId: string,
    @Body() resource: UploadRucResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        UploadRucCommandFromResourceAssembler.toCommandFromResource(
          profileId,
          resource,
        );
      const profile = await this.profileCommandService.handleUploadRuc(command);
      const profileResource =
        ProfileResourceFromEntityAssembler.toResourceFromEntity(profile);

      return res.status(HttpStatus.OK).json({
        message: 'RUC subido exitosamente',
        profile: profileResource,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      return res.status(HttpStatus.BAD_REQUEST).json({ message: errorMessage });
    }
  }

  @Post(':id/photo')
  async uploadPhoto(
    @Param('id') profileId: string,
    @Body() resource: UploadPhotoResource,
    @Res() res: Response,
  ) {
    try {
      const command =
        UploadPhotoCommandFromResourceAssembler.toCommandFromResource(
          profileId,
          resource,
        );
      const profile =
        await this.profileCommandService.handleUploadPhoto(command);
      const profileResource =
        ProfileResourceFromEntityAssembler.toResourceFromEntity(profile);

      return res.status(HttpStatus.OK).json({
        message: 'Foto de perfil actualizada',
        profile: profileResource,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error inesperado';
      return res.status(HttpStatus.BAD_REQUEST).json({ message: errorMessage });
    }
  }
}
