import { Company } from './company.aggregate';
import { CompanyId } from '../valueobjects/company-id.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import {
  SustainabilityCertificationStatus,
  SustainabilityDecision,
} from '../valueobjects/sustainability-certification.vo';

const COMPANY_ID = '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10';
const KEY = `companies/${COMPANY_ID}/sustainability/9c1e2b3a-1111-4222-8333-444455556666.pdf`;
const SUBMITTED_AT = new Date('2026-10-17T15:00:00Z');

function company(complete = true): Company {
  const result = new Company(
    new CompanyId(COMPANY_ID),
    new UserId('7a1e2b3a-1111-4222-8333-444455556666'),
    new Email('mype@vankoo.test'),
  );
  if (complete) {
    result.completeProfile(
      '20601234567',
      'Agroexport Verde S.A.C.',
      'AGRICULTURE',
      '+51 987654321',
      {
        street: 'Av. Siempre Viva 123',
        city: 'Lima',
        state: 'Lima',
        postalCode: '15001',
        country: 'Perú',
      },
    );
  }
  return result;
}

function decision(
  overrides: Partial<SustainabilityDecision> = {},
): SustainabilityDecision {
  return {
    submissionId: 'submission-1',
    certificationId: 'green-1',
    green: true,
    standard: 'ISO_14001',
    issuer: 'SGS del Perú S.A.C.',
    validUntil: '2028-03-31',
    criteria: [
      { code: 'IN_FORCE', passed: true, detail: 'Vigente hasta el 2028-03-31' },
    ],
    reasonCodes: [],
    decidedAt: new Date('2026-10-17T15:01:00Z'),
    ...overrides,
  };
}

describe('Company sustainability certificate', () => {
  it('starts without a certificate', () => {
    const subject = company();
    expect(subject.sustainabilityCertification.status).toBe(
      SustainabilityCertificationStatus.NONE,
    );
    expect(subject.isProfileComplete()).toBe(true);
    expect(company(false).isProfileComplete()).toBe(false);
  });

  it('puts an uploaded certificate under review, with its type from the key', () => {
    const subject = company();
    subject.submitSustainabilityCertificate(KEY, 'submission-1', SUBMITTED_AT);

    const certification = subject.sustainabilityCertification;
    expect(certification.status).toBe(
      SustainabilityCertificationStatus.UNDER_REVIEW,
    );
    expect(certification.objectKey).toBe(KEY);
    expect(certification.contentType).toBe('application/pdf');
    expect(certification.isGreen).toBe(false);
  });

  it('needs the RUC and business name first', () => {
    expect(() =>
      company(false).submitSustainabilityCertificate(
        KEY,
        'submission-1',
        SUBMITTED_AT,
      ),
    ).toThrow('Completa el perfil');
  });

  it.each([
    'companies/00000000-0000-4000-8000-000000000000/sustainability/9c1e2b3a-1111-4222-8333-444455556666.pdf',
    `companies/${COMPANY_ID}/ruc/9c1e2b3a-1111-4222-8333-444455556666.pdf`,
    `companies/${COMPANY_ID}/sustainability/../ruc/x.pdf`,
    `companies/${COMPANY_ID}/sustainability/9c1e2b3a-1111-4222-8333-444455556666.exe`,
  ])('refuses a key outside its own sustainability folder: %s', (key) => {
    expect(() =>
      company().submitSustainabilityCertificate(
        key,
        'submission-1',
        SUBMITTED_AT,
      ),
    ).toThrow('carpeta de sostenibilidad');
  });

  it('records the decision on the current upload', () => {
    const subject = company();
    subject.submitSustainabilityCertificate(KEY, 'submission-1', SUBMITTED_AT);

    expect(subject.recordSustainabilityDecision(decision())).toBe(true);
    const certification = subject.sustainabilityCertification;
    expect(certification.status).toBe(SustainabilityCertificationStatus.GREEN);
    expect(certification.isGreen).toBe(true);
    expect(certification.validUntil).toBe('2028-03-31');
    expect(certification.objectKey).toBe(KEY);
  });

  it('keeps the reasons of a certificate that is not green', () => {
    const subject = company();
    subject.submitSustainabilityCertificate(KEY, 'submission-1', SUBMITTED_AT);

    subject.recordSustainabilityDecision(
      decision({
        green: false,
        standard: null,
        reasonCodes: ['ACCEPTED_STANDARD'],
      }),
    );

    expect(subject.sustainabilityCertification.status).toBe(
      SustainabilityCertificationStatus.NOT_GREEN,
    );
    expect(subject.sustainabilityCertification.reasonCodes).toEqual([
      'ACCEPTED_STANDARD',
    ]);
  });

  it('ignores a decision about an upload that is no longer the current one', () => {
    const subject = company();
    subject.submitSustainabilityCertificate(KEY, 'submission-2', SUBMITTED_AT);

    expect(subject.recordSustainabilityDecision(decision())).toBe(false);
    expect(subject.sustainabilityCertification.status).toBe(
      SustainabilityCertificationStatus.UNDER_REVIEW,
    );
    expect(company().recordSustainabilityDecision(decision())).toBe(false);
  });
});
