import { randomUUID } from 'crypto';

export class InvestorId {
  public readonly value: string;

  // Al poner el "?" le decimos a TypeScript que el valor es opcional
  constructor(value?: string) {
    // Si viene un valor, lo usa. Si viene vacío, genera un UUID nuevo automáticamente.
    this.value = value || randomUUID();
  }
}
