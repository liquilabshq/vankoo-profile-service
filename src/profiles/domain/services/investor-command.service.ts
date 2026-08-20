import { UploadInvestorDniCommand } from '../model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../model/commands/upload-investor-photo.command';
import { Investor } from '../model/aggregates/investor.aggregate';
import { CreateInvestorCommand } from '../model/commands/create-investor.command';
import { CompleteInvestorProfileCommand } from '../model/commands/complete-investor-profile.command';
import { RequestInvestorDniUploadUrlCommand } from '../model/commands/request-investor-dni-upload-url.command';
import { RequestInvestorPhotoUploadUrlCommand } from '../model/commands/request-investor-photo-upload-url.command';
import { VerifyInvestorKycCommand } from '../model/commands/verify-investor-kyc.command';
import { RejectInvestorKycCommand } from '../model/commands/reject-investor-kyc.command';
import { UploadUrlResult } from './file-storage.service';

/** @author LiquiLabs */
export const INVESTOR_COMMAND_SERVICE = 'INVESTOR_COMMAND_SERVICE';

export interface IInvestorCommandService {
  handleCreateInvestor(command: CreateInvestorCommand): Promise<Investor>;
  handleUploadDni(command: UploadInvestorDniCommand): Promise<Investor>;
  handleUploadPhoto(command: UploadInvestorPhotoCommand): Promise<Investor>;
  handleCompleteProfile(
    command: CompleteInvestorProfileCommand,
  ): Promise<Investor>;
  handleRequestDniUploadUrl(
    command: RequestInvestorDniUploadUrlCommand,
  ): Promise<UploadUrlResult>;
  handleRequestPhotoUploadUrl(
    command: RequestInvestorPhotoUploadUrlCommand,
  ): Promise<UploadUrlResult>;
  handleVerifyKyc(command: VerifyInvestorKycCommand): Promise<Investor>;
  handleRejectKyc(command: RejectInvestorKycCommand): Promise<Investor>;
}
