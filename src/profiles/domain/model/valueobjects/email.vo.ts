/** @author  LiquiLabs*
 * value object para Minio
 */
export class Email {
  constructor(public readonly address: string) {
    if (!this.validate(address)) {
      throw new Error('Formato de email inválido');
    }
  }

  public validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
