import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { InvestorProfileResource } from '../resources/investor-profile.resource';

/** @author LiquiLabs */
export class InvestorProfileResourceFromEntityAssembler {
  public static toResourceFromEntity(
    entity: Investor,
  ): InvestorProfileResource {
    return {
      id: entity.id.value,
      contactEmail: entity.contactEmail.address,
      dni: entity.dni?.value,
      firstName: entity.fullName?.firstName,
      lastName: entity.fullName?.lastName,
      contactPhone: entity.contactPhone?.value,
      billingAddress: entity.billingAddress
        ? {
            street: entity.billingAddress.street,
            city: entity.billingAddress.city,
            state: entity.billingAddress.state,
            postalCode: entity.billingAddress.postalCode,
            country: entity.billingAddress.country,
          }
        : undefined,
      dniDocumentUrl: entity.getDniDocumentUrl()?.url,
      photoUrl: entity.getPhotoUrl()?.url,
      profileComplete: entity.dni !== undefined,
      kycStatus: entity.getKycStatus(),
      kycRejectionReason: entity.getKycRejectionReason()?.value,
    };
  }
}
