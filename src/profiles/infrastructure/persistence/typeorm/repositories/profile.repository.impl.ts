import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProfileRepository } from '../../../../domain/repositories/profile.repository';
import { ProfileAggregate } from '../../../../domain/model/aggregates/profile.aggregate';
import { ProfileEntity } from '../entities/profile.entity';

/**
 * @summary Implementación concreta del repositorio usando TypeORM.
 */
@Injectable()
export class ProfileRepositoryImpl implements IProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly typeormRepo: Repository<ProfileEntity>,
  ) {}

  async findById(id: string): Promise<ProfileAggregate | null> {
    const entity = await this.typeormRepo.findOne({ where: { id } });
    if (!entity) return null;

    // Convertimos la entidad de BD a nuestro objeto puro de Dominio
    const profile = new ProfileAggregate(entity.id);
    if (entity.dniUrl) profile.updateDni(entity.dniUrl);
    if (entity.rucUrl) profile.updateRuc(entity.rucUrl);
    if (entity.photoUrl) profile.updatePhoto(entity.photoUrl);

    return profile;
  }

  async save(profile: ProfileAggregate): Promise<void> {
    // Convertimos el Dominio de vuelta a la entidad para guardar
    const entity = new ProfileEntity();
    entity.id = profile.getId();
    entity.dniUrl = profile.getDniUrl() ?? null;
    entity.rucUrl = profile.getRucUrl() ?? null;
    entity.photoUrl = profile.getPhotoUrl() ?? null;

    await this.typeormRepo.save(entity);
  }
}
