/** @author LiquiLabs */
export class InvestorResource {
  id: string;
  dni: string;
  fullName: string; // Uniremos firstName y lastName para el front
  photoUrl?: string;
  dniDocumentUrl?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
  };
}
