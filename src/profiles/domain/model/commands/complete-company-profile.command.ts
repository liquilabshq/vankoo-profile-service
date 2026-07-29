export class CompleteCompanyProfileCommand {
  constructor(
    public readonly companyId: string,
    public readonly rucNumber: string,
    public readonly businessName: string,
    public readonly industrySector: string,
    public readonly contactPhone: string,
    public readonly legalAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
  ) {}
}
