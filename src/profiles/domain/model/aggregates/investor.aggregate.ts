import { KycStatus } from '../valueobjects/kyc-status.enum';
import { KycRejectionReason } from '../valueobjects/kyc-rejection-reason.vo';
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
  private kycRejectionReason?: KycRejectionReason;
  private photoUrl?: DocumentUrl;
  private dniDocumentUrl?: DocumentUrl;
  public bankAccount?: BankAccount;

  constructor(
    // 1. Obligatorios
    public readonly id: InvestorId,
    public readonly userId: UserId,
    public readonly contactEmail: Email,

    // 2. Opcionales (Se llenarán luego)
    public dni?: DniNumber,
    public fullName?: FullName,
    public contactPhone?: PhoneNumber,
    public billingAddress?: Address,

    // 3. Estado de KYC (usado por el repositorio para rehidratar desde persistencia)
    kycStatus?: KycStatus,
    kycRejectionReason?: KycRejectionReason,
  ) {
    this.kycStatus = kycStatus ?? KycStatus.PENDING;
    this.kycRejectionReason = kycRejectionReason;
  }
  public completeProfile(
    dni: string,
    firstName: string,
    lastName: string,
    contactPhone: string,
    billingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
  ): void {
    // Si algún dato es inválido, el constructor del VO debería lanzar un error.
    this.dni = new DniNumber(dni);
    this.fullName = new FullName(firstName, lastName);
    this.contactPhone = new PhoneNumber(contactPhone);
    this.billingAddress = new Address(
      billingAddress.street,
      billingAddress.city,
      billingAddress.state,
      billingAddress.postalCode,
      billingAddress.country,
    );

    // Regla de negocio opcional: Si el perfil se completa, podríamos
    // cambiar el KYC status a 'IN_REVIEW' o algo similar si el flujo lo requiere.
    // this.kycStatus = KycStatus.IN_REVIEW;
  }

  public verifyKyc(): void {
    this.assertKycIsPending();
    this.kycStatus = KycStatus.VERIFIED;
  }

  public rejectKyc(reason: string): void {
    this.assertKycIsPending();
    this.kycRejectionReason = new KycRejectionReason(reason);
    this.kycStatus = KycStatus.REJECTED;
  }

  private assertKycIsPending(): void {
    if (this.kycStatus !== KycStatus.PENDING) {
      throw new Error(
        `El KYC de este perfil ya fue procesado (estado actual: ${this.kycStatus}).`,
      );
    }
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

  public getKycRejectionReason(): KycRejectionReason | undefined {
    return this.kycRejectionReason;
  }

  public getDniDocumentUrl(): DocumentUrl | undefined {
    return this.dniDocumentUrl;
  }

  public getPhotoUrl(): DocumentUrl | undefined {
    return this.photoUrl;
  }
}
