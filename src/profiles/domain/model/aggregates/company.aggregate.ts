import { KycStatus } from '../valueobjects/kyc-status.enum';
import { KycRejectionReason } from '../valueobjects/kyc-rejection-reason.vo';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { CompanyId } from '../valueobjects/company-id.vo';
import { RucNumber } from '../valueobjects/ruc-number.vo';
import { BusinessName } from '../valueobjects/business-name.vo';
import { IndustrySector } from '../valueobjects/industry-sector.enum';
import { Email } from '../valueobjects/email.vo';
import { PhoneNumber } from '../valueobjects/phone-number.vo';
import { Address } from '../valueobjects/address.vo';
import {
  SustainabilityCertification,
  SustainabilityDecision,
} from '../valueobjects/sustainability-certification.vo';

/**
 * @author LiquiLabs
 * @summary Agregado raíz que representa a una Empresa (Prestatario) en la plataforma.
 */
export class Company {
  private kycStatus: KycStatus;
  private kycRejectionReason?: KycRejectionReason;
  private logoUrl?: DocumentUrl; // Equivalente a la foto de perfil
  private rucDocumentUrl?: DocumentUrl;

  constructor(
    public readonly id: CompanyId,
    public readonly userId: UserId,
    public readonly contactEmail: Email,

    // 2. Opcionales (Nacen vacíos y se llenan después. Se les quita el readonly)
    public rucNumber?: RucNumber,
    public businessName?: BusinessName,
    public industrySector?: IndustrySector,
    public contactPhone?: PhoneNumber,
    public legalAddress?: Address,
    public sustainabilityCertification: SustainabilityCertification = SustainabilityCertification.none(),

    // 3. Estado de KYC (usado por el repositorio para rehidratar desde persistencia)
    kycStatus?: KycStatus,
    kycRejectionReason?: KycRejectionReason,
  ) {
    this.kycStatus = kycStatus ?? KycStatus.PENDING;
    this.kycRejectionReason = kycRejectionReason;
  }
  public completeProfile(
    rucNumber: string,
    businessName: string,
    industrySector: string,
    contactPhone: string,
    legalAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
  ): void {
    this.rucNumber = new RucNumber(rucNumber);
    this.businessName = new BusinessName(businessName);
    this.contactPhone = new PhoneNumber(contactPhone);

    //Castear el string al Enum
    this.industrySector = industrySector as IndustrySector;

    this.legalAddress = new Address(
      legalAddress.street,
      legalAddress.city,
      legalAddress.state,
      legalAddress.postalCode,
      legalAddress.country,
    );
  }

  /** Si la empresa ya dio todos los datos que pide completar el perfil. */
  public isProfileComplete(): boolean {
    return Boolean(
      this.rucNumber &&
      this.businessName &&
      this.industrySector &&
      this.contactPhone &&
      this.legalAddress,
    );
  }

  /**
   * La empresa sube su certificado ambiental. Hace falta el RUC y la razón social:
   * el risk-service compara el titular del certificado con lo que SUNAT tiene para ese RUC.
   */
  public submitSustainabilityCertificate(
    objectKey: string,
    submissionId: string,
    submittedAt: Date,
  ): void {
    if (!this.rucNumber || !this.businessName) {
      throw new Error(
        'Completa el perfil (RUC y razón social) antes de subir el certificado.',
      );
    }
    this.sustainabilityCertification = SustainabilityCertification.submitted(
      this.id.value,
      submissionId,
      objectKey,
      submittedAt,
    );
  }

  /**
   * Guarda la decisión del risk-service. Devuelve false si era sobre una subida
   * anterior: la empresa ya subió otro certificado y esa respuesta no vale.
   */
  public recordSustainabilityDecision(
    decision: SustainabilityDecision,
  ): boolean {
    const decided = this.sustainabilityCertification.decide(decision);
    if (!decided) return false;
    this.sustainabilityCertification = decided;
    return true;
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

  public getKycStatus(): KycStatus {
    return this.kycStatus;
  }

  public getKycRejectionReason(): KycRejectionReason | undefined {
    return this.kycRejectionReason;
  }

  public uploadRucDocument(rucUrl: DocumentUrl): void {
    this.rucDocumentUrl = rucUrl;
  }

  public updateLogo(logoUrl: DocumentUrl): void {
    this.logoUrl = logoUrl;
  }

  public getLogoUrl(): DocumentUrl | undefined {
    return this.logoUrl;
  }

  public getRucDocumentUrl(): DocumentUrl | undefined {
    return this.rucDocumentUrl;
  }
}
