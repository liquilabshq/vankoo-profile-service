/** @author LiquiLabs */
export class UserId {
  constructor(public readonly value: string) {
    // Aquí validamos que el evento de IAM realmente mande un UUID
    if (!value || value.trim() === '')
      throw new Error('UserId no puede estar vacío');
  }
}
