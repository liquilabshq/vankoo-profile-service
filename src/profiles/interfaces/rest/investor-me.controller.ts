import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { BEARER_AUTH } from '../../../documentation/openapi.config';
import { INVESTOR_COMMAND_SERVICE } from '../../domain/services/investor-command.service';
import type { IInvestorCommandService } from '../../domain/services/investor-command.service';
import { INVESTOR_QUERY_SERVICE } from '../../domain/services/investor-query.service';
import type { IInvestorQueryService } from '../../domain/services/investor-query.service';
import { GetInvestorByUserIdQuery } from '../../domain/model/queries/get-investor-by-user-id.query';
import { Investor } from '../../domain/model/aggregates/investor.aggregate';
import { CompleteInvestorProfileResource } from './resources/complete-investor-profile.resource';
import { RequestUploadUrlResource } from './resources/request-upload-url.resource';
import { UploadInvestorDniResource } from './resources/upload-investor-dni.resource';
import { UploadInvestorPhotoResource } from './resources/upload-investor-photo.resource';
import { InvestorProfileResource } from './resources/investor-profile.resource';
import { UploadUrlResource } from './resources/upload-url.resource';
import { InvestorProfileResourceFromEntityAssembler } from './transform/investor-profile-resource-from-entity.assembler';
import { CompleteInvestorProfileCommandFromResourceAssembler } from './transform/complete-investor-profile-command-from-resource.assembler';
import { RequestInvestorDniUploadUrlCommand } from '../../domain/model/commands/request-investor-dni-upload-url.command';
import { RequestInvestorPhotoUploadUrlCommand } from '../../domain/model/commands/request-investor-photo-upload-url.command';
import { UploadInvestorDniCommand } from '../../domain/model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../../domain/model/commands/upload-investor-photo.command';

/** El gateway valida el JWT y reenvía el id del usuario en esta cabecera. */
const USER_ID_HEADER = 'x-user-id';

class CallerError extends Error {
  constructor(
    public readonly status: HttpStatus,
    message: string,
  ) {
    super(message);
  }
}

/**
 * @author LiquiLabs
 * @summary El inversionista de quien llama, encontrado por el userId del JWT.
 *
 * Mismo molde que CompanyMeController: es lo que rutea el gateway de los inversionistas
 * (/profile/api/v1/investors/me/**). Cada ruta trabaja sobre el perfil del usuario
 * autenticado, así que nadie puede leer ni cambiar el de otro cambiando un id en la
 * URL. Las rutas por :id de InvestorsController siguen siendo de red interna.
 */
@ApiTags('Investors (me)')
@ApiBearerAuth(BEARER_AUTH)
@ApiHeader({
  name: 'X-User-Id',
  description: 'Id del usuario en IAM; lo pone el gateway',
  required: true,
})
@Controller('investors/me')
export class InvestorMeController {
  constructor(
    @Inject(INVESTOR_COMMAND_SERVICE)
    private readonly investorCommandService: IInvestorCommandService,
    @Inject(INVESTOR_QUERY_SERVICE)
    private readonly investorQueryService: IInvestorQueryService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener el inversionista del usuario autenticado y su estado de KYC',
  })
  @ApiResponse({ status: 200, type: InvestorProfileResource })
  @ApiResponse({ status: 401, description: 'Falta X-User-Id' })
  @ApiResponse({ status: 404, description: 'El usuario no es inversionista' })
  async getMine(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Res() res: Response,
  ) {
    return this.respond(res, async () =>
      InvestorProfileResourceFromEntityAssembler.toResourceFromEntity(
        await this.mine(userId),
      ),
    );
  }

  @Patch('profile')
  @ApiOperation({
    summary:
      'Enviar los datos del KYC. Profile verifica el DNI con la función DNI y el estado pasa a VERIFIED o REJECTED; si la función no contesta, queda PENDING para revisión manual',
  })
  @ApiResponse({ status: 200, type: InvestorProfileResource })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, falta la foto del DNI o el KYC ya está resuelto',
  })
  async submitProfile(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: CompleteInvestorProfileResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const investor = await this.mine(userId);
      if (!investor.getDniDocumentUrl()) {
        throw new CallerError(
          HttpStatus.BAD_REQUEST,
          'Sube la foto de tu DNI antes de enviar tus datos.',
        );
      }
      const updated = await this.investorCommandService.handleCompleteProfile(
        CompleteInvestorProfileCommandFromResourceAssembler.toCommandFromResource(
          investor.id.value,
          resource,
        ),
      );
      return InvestorProfileResourceFromEntityAssembler.toResourceFromEntity(
        updated,
      );
    });
  }

  @Post('dni/upload-url')
  @ApiOperation({
    summary: 'Solicitar una URL prefirmada para subir la foto del DNI',
  })
  @ApiResponse({ status: 200, type: UploadUrlResource })
  async requestDniUploadUrl(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: RequestUploadUrlResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const investor = await this.mine(userId);
      return this.investorCommandService.handleRequestDniUploadUrl(
        new RequestInvestorDniUploadUrlCommand(
          investor.id.value,
          resource.contentType,
        ),
      );
    });
  }

  @Patch('dni')
  @ApiOperation({ summary: 'Registrar la foto del DNI ya subida' })
  @ApiResponse({ status: 200, type: InvestorProfileResource })
  async uploadDni(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: UploadInvestorDniResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const investor = await this.mine(userId);
      const updated = await this.investorCommandService.handleUploadDni(
        new UploadInvestorDniCommand(
          investor.id.value,
          resource.dniDocumentUrl,
        ),
      );
      return InvestorProfileResourceFromEntityAssembler.toResourceFromEntity(
        updated,
      );
    });
  }

  @Post('photo/upload-url')
  @ApiOperation({
    summary: 'Solicitar una URL prefirmada para subir la foto de perfil',
  })
  @ApiResponse({ status: 200, type: UploadUrlResource })
  async requestPhotoUploadUrl(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: RequestUploadUrlResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const investor = await this.mine(userId);
      return this.investorCommandService.handleRequestPhotoUploadUrl(
        new RequestInvestorPhotoUploadUrlCommand(
          investor.id.value,
          resource.contentType,
        ),
      );
    });
  }

  @Patch('photo')
  @ApiOperation({ summary: 'Registrar la foto de perfil ya subida' })
  @ApiResponse({ status: 200, type: InvestorProfileResource })
  async uploadPhoto(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: UploadInvestorPhotoResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const investor = await this.mine(userId);
      const updated = await this.investorCommandService.handleUploadPhoto(
        new UploadInvestorPhotoCommand(investor.id.value, resource.photoUrl),
      );
      return InvestorProfileResourceFromEntityAssembler.toResourceFromEntity(
        updated,
      );
    });
  }

  private async mine(userId: string | undefined): Promise<Investor> {
    if (!userId?.trim()) {
      throw new CallerError(
        HttpStatus.UNAUTHORIZED,
        'Falta la cabecera X-User-Id.',
      );
    }
    const investor = await this.investorQueryService.handleGetInvestorByUserId(
      new GetInvestorByUserIdQuery(userId.trim()),
    );
    if (!investor) {
      throw new CallerError(
        HttpStatus.NOT_FOUND,
        'Tu cuenta no tiene un perfil de inversionista.',
      );
    }
    return investor;
  }

  private async respond(
    res: Response,
    action: () => Promise<unknown>,
  ): Promise<Response> {
    try {
      return res.status(HttpStatus.OK).json(await action());
    } catch (error: unknown) {
      if (error instanceof CallerError) {
        return res.status(error.status).json({ message: error.message });
      }
      const message =
        error instanceof Error ? error.message : 'Error inesperado';
      const status = message.includes('no encontrado')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message });
    }
  }
}
