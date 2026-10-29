import { UploadCompanyRucCommand } from '../model/commands/upload-company-ruc.command';
import { UploadCompanyLogoCommand } from '../model/commands/upload-company-logo.command';
import { Company } from '../model/aggregates/company.aggregate';
import { CreateCompanyCommand } from '../model/commands/create-company.command';
import { CompleteCompanyProfileCommand } from '../model/commands/complete-company-profile.command';
import { RequestCompanyRucUploadUrlCommand } from '../model/commands/request-company-ruc-upload-url.command';
import { RequestCompanyLogoUploadUrlCommand } from '../model/commands/request-company-logo-upload-url.command';
import { VerifyCompanyKycCommand } from '../model/commands/verify-company-kyc.command';
import { RejectCompanyKycCommand } from '../model/commands/reject-company-kyc.command';
import { RequestSustainabilityCertificateUploadUrlCommand } from '../model/commands/request-sustainability-certificate-upload-url.command';
import { SubmitSustainabilityCertificateCommand } from '../model/commands/submit-sustainability-certificate.command';
import { RecordSustainabilityDecisionCommand } from '../model/commands/record-sustainability-decision.command';
import { SubmitCompanyForVerificationCommand } from '../model/commands/submit-company-for-verification.command';
import { RecordCompanyVerificationCommand } from '../model/commands/record-company-verification.command';
import { UpdateCompanyContactCommand } from '../model/commands/update-company-contact.command';
import { UploadUrlResult } from './file-storage.service';

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
  handleRequestRucUploadUrl(
    command: RequestCompanyRucUploadUrlCommand,
  ): Promise<UploadUrlResult>;
  handleRequestLogoUploadUrl(
    command: RequestCompanyLogoUploadUrlCommand,
  ): Promise<UploadUrlResult>;
  handleVerifyKyc(command: VerifyCompanyKycCommand): Promise<Company>;
  handleRejectKyc(command: RejectCompanyKycCommand): Promise<Company>;
  handleRequestSustainabilityCertificateUploadUrl(
    command: RequestSustainabilityCertificateUploadUrlCommand,
  ): Promise<UploadUrlResult>;
  handleSubmitSustainabilityCertificate(
    command: SubmitSustainabilityCertificateCommand,
  ): Promise<Company>;
  handleRecordSustainabilityDecision(
    command: RecordSustainabilityDecisionCommand,
  ): Promise<Company | null>;
  handleSubmitForVerification(
    command: SubmitCompanyForVerificationCommand,
  ): Promise<Company>;
  handleRecordVerification(
    command: RecordCompanyVerificationCommand,
  ): Promise<Company | null>;
  handleUpdateContact(command: UpdateCompanyContactCommand): Promise<Company>;
}
