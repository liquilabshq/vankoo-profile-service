import { UploadInvestorDniCommand } from '../model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../model/commands/upload-investor-photo.command';
import { Investor } from '../model/aggregates/investor.aggregate';

/** @author LiquiLabs */
export const INVESTOR_COMMAND_SERVICE = 'INVESTOR_COMMAND_SERVICE';

export interface IInvestorCommandService {
  handleUploadDni(command: UploadInvestorDniCommand): Promise<Investor>;
  handleUploadPhoto(command: UploadInvestorPhotoCommand): Promise<Investor>;
}
