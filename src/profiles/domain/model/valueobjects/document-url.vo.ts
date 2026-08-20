/** @author LiquiLabs*/
export class DocumentUrl {
  constructor(public readonly url: string) {
    if (!url.startsWith('http'))
      throw new Error('La URL del documento es inválida');
  }
}
