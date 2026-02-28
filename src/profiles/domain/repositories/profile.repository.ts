import { ProfileAggregate } from '../model/aggregates/profile.aggregate';

/**
 * @author LiquiLabs
 * @summary Contrato del repositorio para la persistencia de Perfiles.
 */
export const PROFILE_REPOSITORY = 'PROFILE_REPOSITORY';

export interface IProfileRepository {
  findById(id: string): Promise<ProfileAggregate | null>;
  save(profile: ProfileAggregate): Promise<void>;
}
