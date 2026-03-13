/** @author LiquiLabs */
export class CreateCompanyCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    if (!userId || !email)
      throw new Error('UserId y Email son obligatorios para crear la empresa');
  }
}
