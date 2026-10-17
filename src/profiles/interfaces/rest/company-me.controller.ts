import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { COMPANY_COMMAND_SERVICE } from '../../domain/services/company-command.service';
import type { ICompanyCommandService } from '../../domain/services/company-command.service';
import { COMPANY_QUERY_SERVICE } from '../../domain/services/company-query.service';
import type { ICompanyQueryService } from '../../domain/services/company-query.service';
import { GetCompanyByUserIdQuery } from '../../domain/model/queries/get-company-by-user-id.query';
import { Company } from '../../domain/model/aggregates/company.aggregate';
import { CompleteCompanyProfileResource } from './resources/complete-company-profile.resource';
import { RequestUploadUrlResource } from './resources/request-upload-url.resource';
import { SubmitSustainabilityCertificateResource } from './resources/submit-sustainability-certificate.resource';
import { CompleteCompanyProfileCommandFromResourceAssembler } from './transform/complete-company-profile-command-from-resource.assembler';
import { CompanyProfileResourceFromEntityAssembler } from './transform/company-profile-resource-from-entity.assembler';
import { RequestSustainabilityCertificateUploadUrlCommand } from '../../domain/model/commands/request-sustainability-certificate-upload-url.command';
import { SubmitSustainabilityCertificateCommand } from '../../domain/model/commands/submit-sustainability-certificate.command';

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
 * @summary La empresa de quien llama, encontrada por el userId del JWT.
 *
 * Es lo único de Profile que rutea el gateway (/profile/api/v1/companies/me/**):
 * cada ruta trabaja sobre la empresa del usuario autenticado, así que nadie puede
 * leer ni cambiar la de otro cambiando un id en la URL.
 */
@ApiTags('Companies (me)')
@ApiHeader({
  name: 'X-User-Id',
  description: 'Id del usuario en IAM; lo pone el gateway',
  required: true,
})
@Controller('companies/me')
export class CompanyMeController {
  constructor(
    @Inject(COMPANY_COMMAND_SERVICE)
    private readonly companyCommandService: ICompanyCommandService,
    @Inject(COMPANY_QUERY_SERVICE)
    private readonly companyQueryService: ICompanyQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener la empresa del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 401, description: 'Falta X-User-Id' })
  @ApiResponse({ status: 404, description: 'El usuario no tiene empresa' })
  async getMine(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const company = await this.mine(userId);
      return CompanyProfileResourceFromEntityAssembler.toResourceFromEntity(
        company,
      );
    });
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Completar los datos de la empresa del usuario' })
  async completeProfile(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: CompleteCompanyProfileResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const company = await this.mine(userId);
      const updated = await this.companyCommandService.handleCompleteProfile(
        CompleteCompanyProfileCommandFromResourceAssembler.toCommandFromResource(
          company.id.value,
          resource,
        ),
      );
      return CompanyProfileResourceFromEntityAssembler.toResourceFromEntity(
        updated,
      );
    });
  }

  @Post('sustainability-certificate/upload-url')
  @ApiOperation({
    summary:
      'Solicitar una URL prefirmada para subir el certificado ambiental (PDF, JPG o PNG)',
  })
  async requestCertificateUploadUrl(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: RequestUploadUrlResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const company = await this.mine(userId);
      return this.companyCommandService.handleRequestSustainabilityCertificateUploadUrl(
        new RequestSustainabilityCertificateUploadUrlCommand(
          company.id.value,
          resource.contentType,
        ),
      );
    });
  }

  @Put('sustainability-certificate')
  @ApiOperation({
    summary:
      'Registrar el certificado ya subido: queda en revisión hasta que responda el risk-service',
  })
  @ApiResponse({ status: 200, description: 'Certificado en revisión' })
  @ApiResponse({
    status: 400,
    description: 'Perfil incompleto o URL ajena al almacenamiento',
  })
  async submitCertificate(
    @Headers(USER_ID_HEADER) userId: string | undefined,
    @Body() resource: SubmitSustainabilityCertificateResource,
    @Res() res: Response,
  ) {
    return this.respond(res, async () => {
      const company = await this.mine(userId);
      const updated =
        await this.companyCommandService.handleSubmitSustainabilityCertificate(
          new SubmitSustainabilityCertificateCommand(
            company.id.value,
            resource.fileUrl,
          ),
        );
      return CompanyProfileResourceFromEntityAssembler.toResourceFromEntity(
        updated,
      );
    });
  }

  private async mine(userId: string | undefined): Promise<Company> {
    if (!userId?.trim()) {
      throw new CallerError(
        HttpStatus.UNAUTHORIZED,
        'Falta la cabecera X-User-Id.',
      );
    }
    const company = await this.companyQueryService.handleGetCompanyByUserId(
      new GetCompanyByUserIdQuery(userId.trim()),
    );
    if (!company) {
      throw new CallerError(
        HttpStatus.NOT_FOUND,
        'Tu cuenta no tiene una empresa asociada.',
      );
    }
    return company;
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
      const status = message.includes('no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(status).json({ message });
    }
  }
}
