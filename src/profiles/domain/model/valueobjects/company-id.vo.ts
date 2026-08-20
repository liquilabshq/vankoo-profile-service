import { randomUUID } from 'crypto';

export class CompanyId {
  public readonly value: string;

  constructor(value?: string) {
    this.value = value || randomUUID();
  }
}
