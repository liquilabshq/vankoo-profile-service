/**
 * @author LiquiLabs
 * @summary Recurso de salida que representa los datos públicos de una Empresa.
 */
export class CompanyResource {
  id: string;
  businessName: string;
  rucNumber: string;
  industrySector: string;
  logoUrl?: string;
  rucDocumentUrl?: string;
  kycStatus: string;
  kycRejectionReason?: string;
}
