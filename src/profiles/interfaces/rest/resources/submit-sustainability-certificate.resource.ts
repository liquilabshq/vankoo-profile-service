import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

/** @author LiquiLabs */
export class SubmitSustainabilityCertificateResource {
  @ApiProperty({
    description:
      'fileUrl que devolvió la URL prefirmada del certificado, ya subido',
    example:
      'http://localhost:9100/vankoo-profile-documents/companies/0b6f…/sustainability/9c1e….pdf',
  })
  @IsUrl(
    { require_tld: false },
    { message: 'La URL no tiene un formato válido' },
  )
  @IsNotEmpty({ message: 'La URL del certificado es obligatoria' })
  fileUrl: string;
}
