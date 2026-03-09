/** @author LiquiLabs */
export class CreateInvestorCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    // Los demás datos nacerán vacíos hasta que el usuario complete su perfil
  ) {
    if (!userId || !email)
      throw new Error('UserId y Email son obligatorios para crear el inversor');
  }
}
