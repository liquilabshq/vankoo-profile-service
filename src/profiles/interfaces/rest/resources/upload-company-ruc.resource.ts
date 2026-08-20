import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

/** @author LiquiLabs */
export class UploadCompanyRucResource {
  @ApiProperty({
    description: 'URL pública del documento PDF del RUC subido',
    example: 'https://vankoo-storage.s3.amazonaws.com/rucs/mi-ruc.pdf',
  })
  @IsUrl(
    { require_tld: false },
    { message: 'La URL no tiene un formato válido' },
  )
  @IsNotEmpty({ message: 'La URL del RUC es obligatoria' })
  rucDocumentUrl: string;
}
