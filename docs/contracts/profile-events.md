# Eventos de Profile para el certificado verde y el KYC

Profile publica los eventos de cada perfil en el tópico `vankoo.profile.events`, en JSON plano con un `eventType`. Esta página documenta los que tienen versión, porque los consumen otros servicios: el risk-service, que decide si la empresa es verde y recomienda su KYC, e Invoicing, que no deja subir facturas a una empresa sin verificar. También describe las respuestas que Profile consume de vuelta.

## `SustainabilityCertificateSubmitted` (lo publica Profile)

La empresa registró un certificado ambiental (`PUT /api/v1/companies/me/sustainability-certificate`). La clave de Kafka es el `companyId`.

```json
{
  "eventId": "70000000-0000-4000-8000-000000000001",
  "eventType": "SustainabilityCertificateSubmitted",
  "schemaVersion": 1,
  "occurredAt": "2026-10-16T18:00:00.000Z",
  "profileType": "COMPANY",
  "companyId": "50000000-0000-4000-8000-000000000001",
  "userId": "40000000-0000-4000-8000-000000000001",
  "submissionId": "80000000-0000-4000-8000-000000000001",
  "rucNumber": "20601234567",
  "businessName": "Agroexport Verde S.A.C.",
  "objectKey": "companies/50000000-0000-4000-8000-000000000001/sustainability/60000000-0000-4000-8000-000000000001.pdf",
  "contentType": "application/pdf"
}
```

| Campo | Qué es |
|---|---|
| `eventId` | UUID del mensaje; el consumidor deduplica por él |
| `schemaVersion` | `1`. Un cambio incompatible sube la versión |
| `occurredAt` | Cuándo se registró el certificado (ISO-8601 UTC) |
| `companyId`, `userId` | La empresa y su cuenta de IAM (el `mypeId` de sus subastas) |
| `submissionId` | UUID de esta subida. La respuesta del risk-service lo repite |
| `rucNumber`, `businessName` | Lo que la empresa declaró en su perfil |
| `objectKey` | Dónde está el archivo en el bucket: siempre `companies/{companyId}/sustainability/{uuid}.{pdf,jpg,png}` |
| `contentType` | `application/pdf`, `image/jpeg` o `image/png` |

**El evento lleva la clave del objeto, nunca una URL.** El risk-service la descarga desde su propia dirección del bucket, así que nadie puede hacerle bajar otra cosa. Profile además solo acepta un `fileUrl` de su propio almacenamiento.

## `GreenCertificationIssued` (lo consume Profile)

Lo publica el risk-service en `risk.green-certifications.v1`. Su contrato está en `vankoo-risk-service/docs/contracts/green-certifications/v1`. Profile guarda `decision`, `standard`, `issuer`, `validUntil`, `criteria`, `reasonCodes` y `decidedAt`, siempre que `submissionId` siga siendo la subida vigente. Si no lo es, la empresa ya subió otro certificado y el mensaje se ignora. Aplicar dos veces la misma decisión no cambia nada.

## `CompanyVerificationRequested` (lo publica Profile)

La empresa envió sus datos y su ficha RUC para que la verifiquen (`PATCH /api/v1/companies/me/profile`). La clave de Kafka es el `companyId`. Lo consume el risk-service.

```json
{
  "eventId": "71000000-0000-4000-8000-000000000001",
  "eventType": "CompanyVerificationRequested",
  "schemaVersion": 1,
  "occurredAt": "2026-10-29T18:00:00.000Z",
  "profileType": "COMPANY",
  "requestId": "70000000-0000-4000-8000-000000000001",
  "companyId": "50000000-0000-4000-8000-000000000002",
  "userId": "40000000-0000-4000-8000-000000000002",
  "rucNumber": "20601234567",
  "businessName": "Textiles Andinos S.A.C.",
  "rucDocumentKey": "companies/50000000-0000-4000-8000-000000000002/ruc/60000000-0000-4000-8000-000000000002.pdf"
}
```

| Campo | Qué es |
|---|---|
| `eventId` | UUID del mensaje; el consumidor deduplica por él |
| `schemaVersion` | `1` |
| `requestId` | UUID de esta solicitud. Cada envío tiene uno nuevo; la respuesta del risk-service lo repite |
| `rucNumber`, `businessName` | Lo que la empresa declaró (el RUC, 11 dígitos) |
| `rucDocumentKey` | Dónde está la ficha en el bucket: siempre `companies/{companyId}/ruc/{uuid}.pdf`. Como con el certificado, **una clave y nunca una URL** |

## `CompanyKycStatusChanged` (lo publica Profile)

El estado KYC de la empresa cambió: al enviarla (`IN_REVIEW`), con la decisión del risk-service (`VERIFIED`, `REJECTED` o `PENDING` tras una corrección) o a mano (`/companies/:id/kyc/verify` y `…/reject`). La clave de Kafka es el `companyId`. Lo consume Invoicing.

```json
{
  "eventId": "72000000-0000-4000-8000-000000000001",
  "eventType": "CompanyKycStatusChanged",
  "schemaVersion": 1,
  "occurredAt": "2026-10-29T18:00:05.000Z",
  "profileType": "COMPANY",
  "companyId": "50000000-0000-4000-8000-000000000002",
  "userId": "40000000-0000-4000-8000-000000000002",
  "kycStatus": "VERIFIED"
}
```

| Campo | Qué es |
|---|---|
| `userId` | La cuenta de IAM de la empresa: la que sube las facturas |
| `kycStatus` | `PENDING`, `IN_REVIEW`, `VERIFIED` o `REJECTED`. Solo `VERIFIED` deja subir facturas |
| `occurredAt` | Cuándo cambió. El consumidor se queda con el más reciente: los mensajes de una empresa llegan en orden, pero uno repetido puede llegar tarde |

`KycVerified` y `KycRejected` se siguen publicando en las rutas a mano, sin versión.

## `CompanyVerificationIssued` (lo consume Profile)

Lo publica el risk-service en `risk.company-verifications.v1`. Su contrato está en `vankoo-risk-service/docs/contracts/company-verifications/v1`. Profile lo aplica solo si el perfil sigue `IN_REVIEW` y `requestId` es la solicitud vigente; si no, el mensaje se ignora (uno repetido incluido). Guarda `decision`, `checks`, `reasonCodes`, `fieldErrors`, `evidence`, `demo` y `decidedAt`, y cambia el estado como dice el [README](../../README.md#el-kyc-de-la-empresa).

## Limitación conocida

Profile publica sin outbox: si Kafka no responde justo al registrar el certificado, el error se registra en el log y el certificado se queda «en revisión». Se arregla volviendo a subirlo. Lo mismo pasa con `ProfileCompleted` y los eventos de KYC: si falla `CompanyVerificationRequested`, el perfil se queda «en revisión» y hace falta verificarlo o rechazarlo a mano.
