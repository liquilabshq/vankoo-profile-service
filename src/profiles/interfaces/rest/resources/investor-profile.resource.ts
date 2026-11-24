import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** @author LiquiLabs */
export class InvestorBillingAddressResource {
  @ApiProperty({ example: 'Calle Los Pinos 456' })
  street: string;
  @ApiProperty({ example: 'Lima' })
  city: string;
  @ApiProperty({ example: 'Lima' })
  state: string;
  @ApiProperty({ example: '15074' })
  postalCode: string;
  @ApiProperty({ example: 'Perú' })
  country: string;
}

/**
 * @author LiquiLabs
 * @summary El inversionista de quien llama (GET /investors/me): lo que necesita la app
 * para decidir entre el formulario del KYC, «en revisión», «rechazado» o la app entera.
 */
export class InvestorProfileResource {
  @ApiProperty({ example: '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10' })
  id: string;

  @ApiProperty({ example: 'inversor@vankoo.pe' })
  contactEmail: string;

  @ApiPropertyOptional({ example: '44556677' })
  dni?: string;

  @ApiPropertyOptional({ example: 'Andrés' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mendoza' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+51 988776655' })
  contactPhone?: string;

  @ApiPropertyOptional({ type: InvestorBillingAddressResource })
  billingAddress?: InvestorBillingAddressResource;

  @ApiPropertyOptional({ description: 'Foto del DNI ya subida' })
  dniDocumentUrl?: string;

  @ApiPropertyOptional({ description: 'Avatar; no interviene en el KYC' })
  photoUrl?: string;

  @ApiProperty({
    description:
      'Ya envió sus datos. Con PENDING significa «en revisión»; sin ellos, que el perfil nació vacío',
  })
  profileComplete: boolean;

  @ApiProperty({ enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  kycStatus: string;

  @ApiPropertyOptional({
    example: 'El nombre declarado no coincide con el registrado para este DNI.',
  })
  kycRejectionReason?: string;
}
