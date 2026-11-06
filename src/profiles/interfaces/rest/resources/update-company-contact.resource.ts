import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyAddressResource } from './complete-company-profile.resource';

/** @author LiquiLabs */
export class UpdateCompanyContactResource {
  @ApiProperty({ example: 'MANUFACTURING' })
  @IsString()
  @IsNotEmpty()
  industrySector: string;

  @ApiProperty({ example: '+51 987654321' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CompanyAddressResource)
  legalAddress: CompanyAddressResource;
}
