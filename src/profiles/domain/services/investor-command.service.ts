import { UploadInvestorDniCommand } from '../model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../model/commands/upload-investor-photo.command';
import { Investor } from '../model/aggregates/investor.aggregate';
import { CreateInvestorCommand } from '../model/commands/create-investor.command';
import { CompleteInvestorProfileCommand } from '../model/commands/complete-investor-profile.command';

/** @author LiquiLabs */
export const INVESTOR_COMMAND_SERVICE = 'INVESTOR_COMMAND_SERVICE';

export interface IInvestorCommandService {
  handleCreateInvestor(command: CreateInvestorCommand): Promise<Investor>;
  handleUploadDni(command: UploadInvestorDniCommand): Promise<Investor>;
  handleUploadPhoto(command: UploadInvestorPhotoCommand): Promise<Investor>;
  handleCompleteProfile(
    command: CompleteInvestorProfileCommand,
  ): Promise<Investor>;
}
