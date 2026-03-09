/** @author LiquiLabs*/
export class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly postalCode: string,
    public readonly country: string,
  ) {
    if (!street || !city || !country) {
      throw new Error(
        'La calle, ciudad y país son obligatorios para la dirección',
      );
    }
  }
}
