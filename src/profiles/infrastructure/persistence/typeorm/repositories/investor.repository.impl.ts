import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInvestorRepository } from '../../../../domain/repositories/investor.repository';
import { Investor } from '../../../../domain/model/aggregates/investor.aggregate';
import { InvestorEntity } from '../entities/investor.entity';
import { BankAccountEntity } from '../entities/bank-account.entity';

import { InvestorId } from '../../../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../../../domain/model/valueobjects/user-id.vo';
import { DniNumber } from '../../../../domain/model/valueobjects/dni-number.vo';
import { FullName } from '../../../../domain/model/valueobjects/full-name.vo';
import { Email } from '../../../../domain/model/valueobjects/email.vo';
import { PhoneNumber } from '../../../../domain/model/valueobjects/phone-number.vo';
import { Address } from '../../../../domain/model/valueobjects/address.vo';
import { DocumentUrl } from '../../../../domain/model/valueobjects/document-url.vo';
import { KycStatus } from '../../../../domain/model/valueobjects/kyc-status.enum';
import { KycRejectionReason } from '../../../../domain/model/valueobjects/kyc-rejection-reason.vo';
import { BankAccount } from '../../../../domain/model/entities/bank-account.entity';
import { BankAccountId } from '../../../../domain/model/valueobjects/bank-account-id.vo';

@Injectable()
export class InvestorRepositoryImpl implements IInvestorRepository {
  constructor(
    @InjectRepository(InvestorEntity)
    private readonly typeormRepo: Repository<InvestorEntity>,
  ) {}

  async findById(id: string): Promise<Investor | null> {
    const entity = await this.typeormRepo.findOne({ where: { id } });
    if (!entity) return null;

    // Nuevo orden del constructor
    const investor = new Investor(
      new InvestorId(entity.id),
      new UserId(entity.userId),
      new Email(entity.contactEmail),
      entity.dni ? new DniNumber(entity.dni) : undefined,
      entity.firstName && entity.lastName
        ? new FullName(entity.firstName, entity.lastName)
        : undefined,
      entity.contactPhone ? new PhoneNumber(entity.contactPhone) : undefined,
      entity.billingAddress && entity.billingAddress.street
        ? new Address(
            entity.billingAddress.street,
            entity.billingAddress.city,
            entity.billingAddress.state,
            entity.billingAddress.postalCode,
            entity.billingAddress.country,
          )
        : undefined,
      entity.kycStatus as KycStatus,
      entity.kycRejectionReason
        ? new KycRejectionReason(entity.kycRejectionReason)
        : undefined,
    );

    if (entity.bankAccount) {
      investor.bankAccount = new BankAccount(
        new BankAccountId(entity.bankAccount.id),
        entity.bankAccount.bankName,
        entity.bankAccount.accountNumber,
      );
    }

    if (entity.dniDocumentUrl)
      investor.updateDniDocument(new DocumentUrl(entity.dniDocumentUrl));
    if (entity.photoUrl) investor.updatePhoto(new DocumentUrl(entity.photoUrl));

    return investor;
  }

  async save(investor: Investor): Promise<void> {
    const entity = new InvestorEntity();

    entity.id = investor.id.value;
    entity.userId = investor.userId.value;
    entity.contactEmail = investor.contactEmail.address;

    // Usamos el optional chaining "?."
    entity.dni = investor.dni?.value ?? null;
    entity.firstName = investor.fullName?.firstName || '';
    entity.lastName = investor.fullName?.lastName || '';
    entity.contactPhone = investor.contactPhone?.value ?? null;

    entity.billingAddress = {
      street: investor.billingAddress?.street,
      city: investor.billingAddress?.city,
      state: investor.billingAddress?.state,
      postalCode: investor.billingAddress?.postalCode,
      country: investor.billingAddress?.country,
    } as any;

    entity.dniDocumentUrl = investor.getDniDocumentUrl()?.url ?? null;
    entity.photoUrl = investor.getPhotoUrl()?.url ?? null;

    entity.kycStatus = investor.getKycStatus();
    entity.kycRejectionReason = investor.getKycRejectionReason()?.value ?? null;

    if (investor.bankAccount) {
      const bankEntity = new BankAccountEntity();
      bankEntity.id = investor.bankAccount.id.value;
      bankEntity.bankName = investor.bankAccount.getBankName();
      bankEntity.accountNumber = investor.bankAccount.getAccountNumber();
      entity.bankAccount = bankEntity;
    }

    await this.typeormRepo.save(entity);
  }
}
