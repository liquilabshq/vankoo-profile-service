import { Company, CompanyProfileData } from './company.aggregate';
import { CompanyId } from '../valueobjects/company-id.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { KycStatus } from '../valueobjects/kyc-status.enum';
import { VerificationDecision } from '../valueobjects/kyc-review.vo';

const COMPANY_ID = '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10';
const KEY = `companies/${COMPANY_ID}/ruc/9c1e2b3a-1111-4222-8333-444455556666.pdf`;
const URL = `http://localhost:9100/vankoo-profile-documents/${KEY}`;
const NOW = new Date('2026-10-29T15:00:00Z');
const HOUR = 60 * 60 * 1000;

const DATA: CompanyProfileData = {
  rucNumber: '20601234567',
  businessName: 'Textiles Andinos S.A.C.',
  industrySector: 'MANUFACTURING',
  contactPhone: '+51 987654321',
  legalAddress: {
    street: 'Av. Siempre Viva 123',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15001',
    country: 'Perú',
  },
};

function company(): Company {
  return new Company(
    new CompanyId(COMPANY_ID),
    new UserId('7a1e2b3a-1111-4222-8333-444455556666'),
    new Email('mype@vankoo.test'),
  );
}

function submit(subject: Company, requestId = 'request-1', now = NOW): void {
  subject.submitForVerification(
    DATA,
    new DocumentUrl(URL),
    KEY,
    requestId,
    now,
  );
}

function decision(
  overrides: Partial<VerificationDecision> = {},
): VerificationDecision {
  return {
    requestId: 'request-1',
    verificationId: 'kyc-1',
    decision: 'VERIFIED',
    checks: [
      { code: 'TAXPAYER_FOUND', passed: true, detail: 'Figura en el padrón' },
    ],
    reasonCodes: [],
    fieldErrors: [],
    evidence: [],
    demo: false,
    decidedAt: NOW,
    ...overrides,
  };
}

const rejection = (requestId = 'request-1', decidedAt = NOW) =>
  decision({
    requestId,
    decidedAt,
    decision: 'REJECTED',
    checks: [
      {
        code: 'RUC_DOCUMENT_SIGNED',
        passed: false,
        detail: 'La ficha RUC no tiene firma digital',
      },
    ],
    reasonCodes: ['RUC_DOCUMENT_SIGNED'],
  });

describe('Company KYC', () => {
  it('puts the profile in review with its ficha RUC', () => {
    const subject = company();

    submit(subject);

    expect(subject.getKycStatus()).toBe(KycStatus.IN_REVIEW);
    expect(subject.rucNumber?.value).toBe('20601234567');
    expect(subject.getRucDocumentUrl()?.url).toBe(URL);
    expect(subject.getKycReview().requestId).toBe('request-1');
    expect(subject.getKycReview().rucDocumentKey).toBe(KEY);
  });

  it('refuses a RUC that is not 11 digits and a ficha outside its folder', () => {
    const subject = company();

    expect(() =>
      subject.submitForVerification(
        { ...DATA, rucNumber: '2060123' },
        new DocumentUrl(URL),
        KEY,
        'r',
        NOW,
      ),
    ).toThrow('11 dígitos');
    expect(() =>
      subject.submitForVerification(
        DATA,
        new DocumentUrl(URL),
        `companies/${COMPANY_ID}/sustainability/9c1e2b3a-1111-4222-8333-444455556666.pdf`,
        'r',
        NOW,
      ),
    ).toThrow('ficha RUC');
    expect(subject.getKycStatus()).toBe(KycStatus.PENDING);
  });

  it('cannot be sent twice while in review', () => {
    const subject = company();
    submit(subject);

    expect(() => submit(subject, 'request-2')).toThrow('ya están en revisión');
  });

  it('is verified by the decision on the current request', () => {
    const subject = company();
    submit(subject);

    expect(subject.recordVerification(decision({ demo: true }))).toBe(true);

    expect(subject.getKycStatus()).toBe(KycStatus.VERIFIED);
    expect(subject.getKycReview().demo).toBe(true);
    expect(() => submit(subject, 'request-2')).toThrow('ya está verificada');
  });

  it('ignores a decision about an older request', () => {
    const subject = company();
    submit(subject);

    expect(subject.recordVerification(decision({ requestId: 'old' }))).toBe(
      false,
    );
    expect(subject.getKycStatus()).toBe(KycStatus.IN_REVIEW);
  });

  it('goes back to pending with the fields to correct, without a wait', () => {
    const subject = company();
    submit(subject);

    subject.recordVerification(
      decision({
        decision: 'CORRECTION_REQUIRED',
        fieldErrors: [{ field: 'rucNumber', code: 'RUC_NOT_FOUND' }],
      }),
    );

    expect(subject.getKycStatus()).toBe(KycStatus.PENDING);
    expect(subject.getKycReview().fieldErrors).toEqual([
      { field: 'rucNumber', code: 'RUC_NOT_FOUND' },
    ]);
    expect(subject.getKycReview().attempts).toBe(0);
    submit(subject, 'request-2');
    expect(subject.getKycStatus()).toBe(KycStatus.IN_REVIEW);
    expect(subject.getKycReview().fieldErrors).toEqual([]);
  });

  it('waits 24 h, then 72 h, then 7 days after each rejection', () => {
    const subject = company();
    const waits: number[] = [];
    let now = NOW;
    for (const [index, requestId] of ['r1', 'r2', 'r3', 'r4'].entries()) {
      submit(subject, requestId, now);
      subject.recordVerification(rejection(requestId, now));
      const retry = subject.getKycReview().retryAvailableAt as Date;
      waits.push((retry.getTime() - now.getTime()) / HOUR);
      expect(subject.getKycReview().attempts).toBe(index + 1);
      now = retry;
    }

    expect(waits).toEqual([24, 72, 168, 168]);
    expect(subject.getKycRejectionReason()?.value).toBe(
      'La ficha RUC no tiene firma digital',
    );
  });

  it('cannot be sent again before the wait is over', () => {
    const subject = company();
    submit(subject);
    subject.recordVerification(rejection());

    expect(() =>
      submit(subject, 'request-2', new Date(NOW.getTime() + 23 * HOUR)),
    ).toThrow('Podrás volver a enviarlo');
    submit(subject, 'request-2', new Date(NOW.getTime() + 24 * HOUR));
    expect(subject.getKycStatus()).toBe(KycStatus.IN_REVIEW);
    expect(subject.getKycRejectionReason()).toBeUndefined();
  });

  it('lets only a verified company edit its contact', () => {
    const subject = company();
    submit(subject);
    const address = { ...DATA.legalAddress, street: 'Jr. Nuevo 456' };

    expect(() =>
      subject.updateContact('RETAIL', '+51 911111111', address),
    ).toThrow('Solo una empresa verificada');
    subject.recordVerification(decision());
    subject.updateContact('RETAIL', '+51 911111111', address);

    expect(subject.legalAddress?.street).toBe('Jr. Nuevo 456');
    expect(subject.contactPhone?.value).toBe('+51 911111111');
    expect(subject.rucNumber?.value).toBe('20601234567');
  });

  it('can still be verified or rejected by hand while in review', () => {
    const verified = company();
    submit(verified);
    verified.verifyKyc();
    expect(verified.getKycStatus()).toBe(KycStatus.VERIFIED);

    const rejected = company();
    submit(rejected);
    rejected.rejectKyc('Documento ilegible', NOW);
    expect(rejected.getKycStatus()).toBe(KycStatus.REJECTED);
    expect(rejected.getKycReview().retryAvailableAt).toEqual(
      new Date(NOW.getTime() + 24 * HOUR),
    );
    expect(() => rejected.verifyKyc()).toThrow('ya fue procesado');
  });
});
