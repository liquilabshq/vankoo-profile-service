import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInvestorRepository } from '../../../../domain/repositories/investor.repository';
import { Investor } from '../../../../domain/model/aggregates/investor.aggregate';
import { InvestorEntity } from '../entities/investor.entity';
import { BankAccountEntity } from '../entities/bank-account.entity';

// Importación de Value Objects
import { InvestorId } from '../../../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../../../domain/model/valueobjects/user-id.vo';
import { DniNumber } from '../../../../domain/model/valueobjects/dni-number.vo';
import { FullName } from '../../../../domain/model/valueobjects/full-name.vo';
import { Email } from '../../../../domain/model/valueobjects/email.vo';
import { PhoneNumber } from '../../../../domain/model/valueobjects/phone-number.vo';
import { Address } from '../../../../domain/model/valueobjects/address.vo';
import { DocumentUrl } from '../../../../domain/model/valueobjects/document-url.vo';
import { BankAccount } from '../../../../domain/model/entities/bank-account.entity';
import { BankAccountId } from '../../../../domain/model/valueobjects/bank-account-id.vo';

/** @author LiquiLabs */
@Injectable()
export class InvestorRepositoryImpl implements IInvestorRepository {
  constructor(
    @InjectRepository(InvestorEntity)
    private readonly typeormRepo: Repository<InvestorEntity>,
  ) {}

  async findById(id: string): Promise<Investor | null> {
    // Como pusimos eager: true en la entidad, TypeORM traerá el bankAccount automáticamente
    const entity = await this.typeormRepo.findOne({ where: { id } });
    if (!entity) return null;

    const investor = new Investor(
      new InvestorId(entity.id),
      new UserId(entity.userId),
      new DniNumber(entity.dni),
      new FullName(entity.firstName, entity.lastName),
      new Email(entity.contactEmail),
      entity.contactPhone ? new PhoneNumber(entity.contactPhone) : undefined,
      new Address(
        entity.billingAddress.street,
        entity.billingAddress.city,
        entity.billingAddress.state,
        entity.billingAddress.postalCode,
        entity.billingAddress.country,
      ),
    );

    // Restauramos la cuenta bancaria si existe
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
    entity.dni = investor.dni.value;
    entity.firstName = investor.fullName.firstName;
    entity.lastName = investor.fullName.lastName;
    entity.contactEmail = investor.contactEmail.address;
    entity.contactPhone = investor.contactPhone
      ? investor.contactPhone.value
      : null;

    entity.billingAddress = {
      street: investor.billingAddress.street,
      city: investor.billingAddress.city,
      state: investor.billingAddress.state,
      postalCode: investor.billingAddress.postalCode,
      country: investor.billingAddress.country,
    };

    // Extraemos URLs de forma segura
    entity.dniDocumentUrl = investor.getDniDocumentUrl()?.url ?? null;
    entity.photoUrl = investor.getPhotoUrl()?.url ?? null;

    // Manejamos la entidad interna BankAccount
    if (investor.bankAccount) {
      const bankEntity = new BankAccountEntity();
      bankEntity.id = investor.bankAccount.id.value;
      bankEntity.bankName = investor.bankAccount.getBankName();
      bankEntity.accountNumber = investor.bankAccount.getAccountNumber();
      entity.bankAccount = bankEntity; // Por el cascade: true, TypeORM la guardará sola
    }

    await this.typeormRepo.save(entity);
  }
}
