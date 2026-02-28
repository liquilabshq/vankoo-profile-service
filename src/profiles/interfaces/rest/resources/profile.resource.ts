/**
 * @author LiquiLabs
 * @summary Recurso de salida que representa los datos públicos de un Perfil.
 * Este es el objeto final que se envía en la respuesta HTTP.
 */
export class ProfileResource {
  id: string;
  dniUrl?: string;
  rucUrl?: string;
  photoUrl?: string;
}
