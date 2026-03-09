import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

/** @author LiquiLabs */
export class UploadCompanyLogoResource {
  @ApiProperty({
    description: 'URL pública del logo de la empresa',
    example: 'https://vankoo-storage.s3.amazonaws.com/logos/empresa.png',
  })
  @IsUrl(
    { require_tld: false },
    { message: 'La URL no tiene un formato válido' },
  )
  @IsNotEmpty({ message: 'La URL del logo es obligatoria' })
  logoUrl: string;
}
