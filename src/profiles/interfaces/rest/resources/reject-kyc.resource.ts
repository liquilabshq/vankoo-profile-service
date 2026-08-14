import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** @author LiquiLabs */
export class RejectKycResource {
  @ApiProperty({
    description: 'Motivo del rechazo del KYC',
    example: 'La foto del DNI está ilegible',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
