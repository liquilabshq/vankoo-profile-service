import { KycStatus } from '../valueobjects/kyc-status.enum';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { CompanyId } from '../valueobjects/company-id.vo';
import { RucNumber } from '../valueobjects/ruc-number.vo';
import { BusinessName } from '../valueobjects/business-name.vo';
import { IndustrySector } from '../valueobjects/industry-sector.enum';
import { Email } from '../valueobjects/email.vo';
import { PhoneNumber } from '../valueobjects/phone-number.vo';
import { Address } from '../valueobjects/address.vo';
import { SustainabilityStatus } from '../valueobjects/sustainability-status.vo';

/**
 * @author LiquiLabs
 * @summary Agregado raíz que representa a una Empresa (Prestatario) en la plataforma.
 */
export class Company {
  private kycStatus: KycStatus;
  private logoUrl?: DocumentUrl; // Equivalente a la foto de perfil
  private rucDocumentUrl?: DocumentUrl;

  constructor(
    public readonly id: CompanyId,
    public readonly userId: UserId,
    public readonly rucNumber: RucNumber,
    public readonly businessName: BusinessName,
    public readonly industrySector: IndustrySector,
    public readonly contactEmail: Email,
    public readonly contactPhone: PhoneNumber | undefined,
    public readonly legalAddress: Address,
    public readonly sustainabilityStatus: SustainabilityStatus,
  ) {
    this.kycStatus = KycStatus.PENDING;
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
