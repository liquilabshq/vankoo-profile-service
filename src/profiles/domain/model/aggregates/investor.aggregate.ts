import { KycStatus } from '../valueobjects/kyc-status.enum';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { BankAccount } from '../entities/bank-account.entity';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import { Address } from '../valueobjects/address.vo';
import { InvestorId } from '../valueobjects/investor-id.vo';
import { DniNumber } from '../valueobjects/dni-number.vo';
import { FullName } from '../valueobjects/full-name.vo';
import { PhoneNumber } from '../valueobjects/phone-number.vo';

/**
 * @author LiquiLabs
 * @summary Agregado raíz que representa a un Inversor en la plataforma.
 */
export class Investor {
  private kycStatus: KycStatus;
  private photoUrl?: DocumentUrl;
  private dniDocumentUrl?: DocumentUrl;
  public bankAccount?: BankAccount;

  constructor(
    public readonly id: InvestorId,
    public readonly userId: UserId,
    public readonly dni: DniNumber,
    public readonly fullName: FullName,
    public readonly contactEmail: Email,
    public readonly contactPhone: PhoneNumber | undefined,
    public readonly billingAddress: Address,
  ) {
    this.kycStatus = KycStatus.PENDING;
  }

  public verifyKyc(): void {
    this.kycStatus = KycStatus.VERIFIED;
  }

  public updatePhoto(photoUrl: DocumentUrl): void {
    this.photoUrl = photoUrl;
  }

  public updateDniDocument(dniDocumentUrl: DocumentUrl): void {
    this.dniDocumentUrl = dniDocumentUrl;
  }

  public getKycStatus(): KycStatus {
    return this.kycStatus;
  }

  public getDniDocumentUrl(): DocumentUrl | undefined {
    return this.dniDocumentUrl;
  }

  public getPhotoUrl(): DocumentUrl | undefined {
    return this.photoUrl;
  }
}
