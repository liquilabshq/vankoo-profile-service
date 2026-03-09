import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { InvestorResource } from '../resources/investor.resource';

/** @author LiquiLabs */
export class InvestorResourceFromEntityAssembler {
  public static toResourceFromEntity(entity: Investor): InvestorResource {
    return {
      id: entity.id.value,
      dni: entity.dni.value,
      fullName: `${entity.fullName.firstName} ${entity.fullName.lastName}`, // Concatenamos para el front
      photoUrl: entity.getPhotoUrl()?.url,
      dniDocumentUrl: entity.getDniDocumentUrl()?.url,
      bankAccount: entity.bankAccount
        ? {
            bankName: entity.bankAccount.getBankName(),
            accountNumber: entity.bankAccount.getAccountNumber(),
          }
        : undefined,
    };
  }
}
