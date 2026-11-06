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
import { KycReview, VerificationDecision } from '../valueobjects/kyc-review.vo';

const RUC_PATTERN = /^\d{11}$/;

export interface CompanyProfileData {
  rucNumber: string;
  businessName: string;
  industrySector: string;
  contactPhone: string;
  legalAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

/**
 * @author LiquiLabs
 * @summary Agregado raíz que representa a una Empresa (Prestatario) en la plataforma.
 */
export class Company {
  private kycStatus: KycStatus;
  private kycRejectionReason?: KycRejectionReason;
  private logoUrl?: DocumentUrl; // Equivalente a la foto de perfil
  private rucDocumentUrl?: DocumentUrl;
  private kycReview: KycReview;

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
    kycReview?: KycReview,
  ) {
    this.kycStatus = kycStatus ?? KycStatus.PENDING;
    this.kycRejectionReason = kycRejectionReason;
    this.kycReview = kycReview ?? KycReview.none();
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

  /**
   * La empresa envía sus datos y su ficha RUC para que la verifiquen: el perfil queda
   * en revisión hasta que responda el risk-service. Se puede desde PENDING (también
   * tras una corrección) y desde REJECTED una vez cumplida la espera. El RUC y la
   * razón social solo cambian por aquí; ya verificada, solo el contacto.
   */
  public submitForVerification(
    data: CompanyProfileData,
    rucDocumentUrl: DocumentUrl,
    rucDocumentKey: string,
    requestId: string,
    now: Date,
  ): void {
    if (this.kycStatus === KycStatus.IN_REVIEW) {
      throw new Error('Tus datos ya están en revisión.');
    }
    if (this.kycStatus === KycStatus.VERIFIED) {
      throw new Error('Tu empresa ya está verificada.');
    }
    if (
      this.kycStatus === KycStatus.REJECTED &&
      !this.kycReview.canResubmitAt(now)
    ) {
      throw new Error(
        `Podrás volver a enviarlo desde el ${this.kycReview.retryAvailableAt?.toISOString()}.`,
      );
    }
    if (!RUC_PATTERN.test(data.rucNumber.trim())) {
      throw new Error('El RUC debe tener 11 dígitos.');
    }
    this.completeProfile(
      data.rucNumber.trim(),
      data.businessName,
      data.industrySector,
      data.contactPhone,
      data.legalAddress,
    );
    this.kycReview = this.kycReview.submitted(
      this.id.value,
      requestId,
      rucDocumentKey,
      now,
    );
    this.rucDocumentUrl = rucDocumentUrl;
    this.kycRejectionReason = undefined;
    this.kycStatus = KycStatus.IN_REVIEW;
  }

  /**
   * Guarda la decisión del risk-service y cambia el estado con ella. Devuelve false si
   * no aplica: el perfil no está en revisión o la decisión es de una solicitud anterior.
   * CORRECTION_REQUIRED vuelve a PENDING con los campos a corregir, sin espera.
   */
  public recordVerification(decision: VerificationDecision): boolean {
    if (this.kycStatus !== KycStatus.IN_REVIEW) return false;
    const decided = this.kycReview.decide(decision);
    if (!decided) return false;
    this.kycReview = decided;
    if (decision.decision === 'VERIFIED') {
      this.kycStatus = KycStatus.VERIFIED;
    } else if (decision.decision === 'REJECTED') {
      this.kycStatus = KycStatus.REJECTED;
      this.kycRejectionReason = new KycRejectionReason(
        decided.firstFailureDetail ?? 'No se pudo verificar la empresa.',
      );
    } else {
      this.kycStatus = KycStatus.PENDING;
    }
    return true;
  }

  /** Ya verificada, la empresa solo puede cambiar su contacto: el RUC y la razón social quedan fijos. */
  public updateContact(
    industrySector: string,
    contactPhone: string,
    legalAddress: CompanyProfileData['legalAddress'],
  ): void {
    if (this.kycStatus !== KycStatus.VERIFIED) {
      throw new Error(
        'Solo una empresa verificada puede editar sus datos de contacto.',
      );
    }
    this.industrySector = industrySector as IndustrySector;
    this.contactPhone = new PhoneNumber(contactPhone);
    this.legalAddress = new Address(
      legalAddress.street,
      legalAddress.city,
      legalAddress.state,
      legalAddress.postalCode,
      legalAddress.country,
    );
  }

  public verifyKyc(): void {
    this.assertKycIsOpen();
    this.kycStatus = KycStatus.VERIFIED;
  }

  public rejectKyc(reason: string, now: Date = new Date()): void {
    this.assertKycIsOpen();
    this.kycRejectionReason = new KycRejectionReason(reason);
    this.kycReview = this.kycReview.rejectedByHand(now);
    this.kycStatus = KycStatus.REJECTED;
  }

  /** Verificar o rechazar a mano se puede mientras nadie haya decidido. */
  private assertKycIsOpen(): void {
    if (
      this.kycStatus !== KycStatus.PENDING &&
      this.kycStatus !== KycStatus.IN_REVIEW
    ) {
      throw new Error(
        `El KYC de este perfil ya fue procesado (estado actual: ${this.kycStatus}).`,
      );
    }
  }

  public getKycReview(): KycReview {
    return this.kycReview;
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
