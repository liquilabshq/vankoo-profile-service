import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CompleteCompanyProfileResource } from './complete-company-profile.resource';

/** @author LiquiLabs */
export class SubmitCompanyProfileResource extends CompleteCompanyProfileResource {
  @ApiProperty({
    description:
      'El fileUrl que devolvió POST /companies/me/ruc/upload-url, ya con la ficha RUC subida',
    example:
      'http://localhost:9100/vankoo-profile-documents/companies/0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10/ruc/9c1e2b3a-1111-4222-8333-444455556666.pdf',
  })
  @IsString()
  @IsNotEmpty({ message: 'Falta la ficha RUC' })
  rucDocumentUrl: string;
}
