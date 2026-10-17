import { GreenCertificationIssuedSubscriber } from './green-certification-issued.subscriber';
import { ICompanyCommandService } from '../../domain/services/company-command.service';

const EVENT = {
  eventId: '90000000-0000-4000-8000-000000000001',
  eventType: 'GreenCertificationIssued',
  schemaVersion: 1,
  occurredAt: '2026-10-16T18:00:00.000Z',
  data: {
    certificationId: 'green-1',
    submissionId: 'submission-1',
    companyId: 'company-1',
    mypeUserId: 'user-1',
    decision: 'GREEN',
    standard: 'ISO_14001',
    issuer: 'SGS del Perú S.A.C.',
    validUntil: '2028-03-31',
    criteria: [{ code: 'IN_FORCE', passed: true, detail: 'Vigente' }],
    reasonCodes: [],
    decidedAt: '2026-10-16T18:00:00.000Z',
    rulesVersion: 'green-v1',
  },
};

function subscriber() {
  const record = jest.fn().mockResolvedValue(null);
  const commands = {
    handleRecordSustainabilityDecision: record,
  } as unknown as ICompanyCommandService;
  return { subject: new GreenCertificationIssuedSubscriber(commands), record };
}

describe('GreenCertificationIssuedSubscriber', () => {
  it('records the decision of the contract example, even wrapped in value', async () => {
    const { subject, record } = subscriber();

    await subject.handle({ value: EVENT });

    expect(record).toHaveBeenCalledWith({
      companyId: 'company-1',
      decision: expect.objectContaining({
        submissionId: 'submission-1',
        certificationId: 'green-1',
        green: true,
        validUntil: '2028-03-31',
        decidedAt: new Date('2026-10-16T18:00:00.000Z'),
      }) as unknown,
    });
  });

  it.each([
    { ...EVENT, schemaVersion: 2 },
    { ...EVENT, eventType: 'SomethingElse' },
    { ...EVENT, data: { ...EVENT.data, submissionId: '' } },
    null,
  ])('ignores what is not a GreenCertificationIssued v1', async (message) => {
    const { subject, record } = subscriber();

    await subject.handle(message);

    expect(record).not.toHaveBeenCalled();
  });
});
