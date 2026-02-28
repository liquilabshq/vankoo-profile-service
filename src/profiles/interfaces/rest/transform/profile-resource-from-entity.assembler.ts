import { ProfileAggregate } from '../../../domain/model/aggregates/profile.aggregate';
import { ProfileResource } from '../resources/profile.resource';

/**
 * @author LiquiLabs
 * @summary Ensamblador para convertir un Agregado de Dominio a un Recurso REST.
 */
export class ProfileResourceFromEntityAssembler {
  public static toResourceFromEntity(
    entity: ProfileAggregate,
  ): ProfileResource {
    return {
      id: entity.getId(),
      dniUrl: entity.getDniUrl(),
      // rucUrl: entity.getRucUrl(), etc...
    };
  }
}
