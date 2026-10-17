# Eventos de Profile para el certificado verde

Profile publica los eventos de cada perfil en el tópico `vankoo.profile.events`, en JSON plano con un `eventType`. Esta página documenta el único que tiene versión, porque lo consume otro servicio: el risk-service, que decide si la empresa es verde. También describe la respuesta que Profile consume de vuelta.

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

## Limitación conocida

Profile publica sin outbox: si Kafka no responde justo al registrar el certificado, el error se registra en el log y el certificado se queda «en revisión». Se arregla volviendo a subirlo. Lo mismo pasa hoy con `ProfileCompleted` y los eventos de KYC.
