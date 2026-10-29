import { CompanyVerificationIssuedSubscriber } from './company-verification-issued.subscriber';
import { ICompanyCommandService } from '../../domain/services/company-command.service';

const EVENT = {
  eventId: '91000000-0000-4000-8000-000000000001',
  eventType: 'CompanyVerificationIssued',
  schemaVersion: 1,
  occurredAt: '2026-10-29T18:00:00.000Z',
  data: {
    verificationId: 'kyc-1',
    requestId: 'request-1',
    companyId: 'company-1',
    userId: 'user-1',
    decision: 'REJECTED',
    checks: [
      {
        code: 'RUC_DOCUMENT_RECENT',
        passed: false,
        detail: 'Debe tener 30 días o menos',
      },
    ],
    reasonCodes: ['RUC_DOCUMENT_RECENT'],
    fieldErrors: [],
    evidence: [{ code: 'COACTIVE_DEBT', detail: 'Deuda coactiva' }],
    demo: true,
    decidedAt: '2026-10-29T18:00:00.000Z',
    rulesVersion: 'kyc-v1',
  },
};

function subscriber() {
  const record = jest.fn().mockResolvedValue(null);
  const commands = {
    handleRecordVerification: record,
  } as unknown as ICompanyCommandService;
  return { subject: new CompanyVerificationIssuedSubscriber(commands), record };
}

describe('CompanyVerificationIssuedSubscriber', () => {
  it('records the decision of the contract example, even wrapped in value', async () => {
    const { subject, record } = subscriber();

    await subject.handle({ value: EVENT });

    expect(record).toHaveBeenCalledWith({
      companyId: 'company-1',
      decision: expect.objectContaining({
        requestId: 'request-1',
        verificationId: 'kyc-1',
        decision: 'REJECTED',
        reasonCodes: ['RUC_DOCUMENT_RECENT'],
        demo: true,
        decidedAt: new Date('2026-10-29T18:00:00.000Z'),
      }) as unknown,
    });
  });

  it.each([
    { ...EVENT, schemaVersion: 2 },
    { ...EVENT, eventType: 'SomethingElse' },
    { ...EVENT, data: { ...EVENT.data, requestId: '' } },
    { ...EVENT, data: { ...EVENT.data, decision: 'MAYBE' } },
    null,
  ])('ignores what is not a CompanyVerificationIssued v1', async (message) => {
    const { subject, record } = subscriber();

    await subject.handle(message);

    expect(record).not.toHaveBeenCalled();
  });
});
