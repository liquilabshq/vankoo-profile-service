export class CompleteInvestorProfileCommand {
  constructor(
    public readonly investorId: string,
    public readonly dni: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly contactPhone: string,
    public readonly billingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
  ) {}
}
