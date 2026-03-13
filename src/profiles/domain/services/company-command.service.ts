import { UploadCompanyRucCommand } from '../model/commands/upload-company-ruc.command';
import { UploadCompanyLogoCommand } from '../model/commands/upload-company-logo.command';
import { Company } from '../model/aggregates/company.aggregate';
import { CreateCompanyCommand } from '../model/commands/create-company.command';
import { CompleteCompanyProfileCommand } from '../model/commands/complete-company-profile.command';

/**
 * @author LiquiLabs
 */
export const COMPANY_COMMAND_SERVICE = 'COMPANY_COMMAND_SERVICE';

export interface ICompanyCommandService {
  handleCreateCompany(command: CreateCompanyCommand): Promise<Company>;
  handleUploadRuc(command: UploadCompanyRucCommand): Promise<Company>;
  handleUploadLogo(command: UploadCompanyLogoCommand): Promise<Company>;
  handleCompleteProfile(
    command: CompleteCompanyProfileCommand,
  ): Promise<Company>;
}
