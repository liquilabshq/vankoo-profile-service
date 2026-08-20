# User Stories — Vankoo Profile Service

## Descripción

`profile-service` es el microservicio responsable de la gestión de perfiles de los dos tipos de usuario de Vankoo: **Inversores** (personas naturales que financian facturas) y **Empresas/MYPE** (personas jurídicas que buscan liquidez). Se encarga de crear el perfil inicial cuando un usuario se registra en IAM, permitir que complete sus datos personales/legales, gestionar la subida segura de sus documentos de KYC (DNI, RUC, foto, logo) hacia MinIO, y notificar al resto del sistema cuando un perfil queda completo.

Sigue una arquitectura DDD por capas (`domain`, `application`, `infrastructure`, `interfaces`), con dos bounded contexts dentro del mismo servicio: **Investors** y **Companies**.

## Convenciones de este documento

- **Historia de Usuario**: el actor (`Como...`) es una persona real dentro del dominio del negocio (Inversor, Empresa, Analista de Backoffice). Aporta valor directo y visible para ese rol.
- **Historia Técnica**: el actor es el equipo de desarrollo/arquitectura. Describe una capacidad interna (integración, infraestructura, contrato de API) que no es una acción consciente de un usuario final, pero habilita o sostiene una o más historias de usuario. Un sistema externo (IAM, un microservicio, "el frontend") **no** es una persona válida para el patrón `Como/Quiero/Para` — cuando la necesidad viene de ahí, se redacta como historia técnica con el equipo de desarrollo como actor.
- El título sigue estrictamente `Como / Quiero / Para`. Los criterios de aceptación van aparte, en formato Gherkin (`Given / When / Then`, con `And` opcional).
- **Estado:** Implementado (ya existe en el código) o Planeado (identificado como necesario, pendiente de construir — sus criterios de aceptación son una propuesta, no una verificación de comportamiento actual).

---

## 1. Registro y creación de perfil

### HT-01 — Aprovisionamiento automático de perfil
**Tipo:** Historia Técnica

**Como** equipo de desarrollo, **quiero** que profile-service cree automáticamente un perfil vacío al consumir el evento de registro publicado por IAM, **para** que cada usuario nuevo tenga un espacio de perfil disponible sin intervención manual ni acoplamiento síncrono entre servicios.

**Criterios de aceptación:**
```gherkin
Given un usuario se registró exitosamente en IAM con rol ROLE_INVESTOR o ROLE_MYPE
When IAM publica el evento de registro en el tópico "vankoo.iam.events"
Then profile-service crea un Investor (si el rol es ROLE_INVESTOR) o una Company (si es ROLE_MYPE)
And el perfil se crea con kycStatus = PENDING y todos los campos opcionales vacíos
And si el rol no es reconocido, el evento se ignora sin afectar al servicio
```
**Relacionado:** consumidor `UserRegisteredSubscriber`, tópico `vankoo.iam.events`.
**Estado:** Implementado.

---

## 2. Completar perfil

### US-01 — Completar perfil de inversor
**Tipo:** Historia de Usuario

**Como** inversor, **quiero** completar mi perfil con mi DNI, nombre completo, teléfono y dirección de facturación, **para** poder operar en la plataforma con mis datos reales.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil de inversor creado pero incompleto
When envío mi DNI, nombre, apellido, teléfono y dirección de facturación
Then mis datos quedan guardados en mi perfil
And puedo consultar mi perfil y ver la información actualizada
```
**Relacionado:** `PATCH /api/v1/investors/{id}/profile`
**Estado:** Implementado.

### US-02 — Completar perfil de empresa
**Tipo:** Historia de Usuario

**Como** representante de una empresa (MYPE), **quiero** completar el perfil de mi empresa con su RUC, razón social, sector industrial, teléfono y dirección legal, **para** poder publicar facturas en el marketplace.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil de empresa creado pero incompleto
When envío el RUC, razón social, sector industrial, teléfono y dirección legal
Then los datos quedan guardados en el perfil de la empresa
And puedo consultar el perfil y ver la información actualizada
```
**Relacionado:** `PATCH /api/v1/companies/{id}/profile`
**Estado:** Implementado.

### US-03 — Consultar mi perfil
**Tipo:** Historia de Usuario

**Como** inversor o representante de empresa, **quiero** consultar los datos de mi perfil, **para** verificar que mi información esté correcta y completa.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil existente identificado por su ID
When solicito la información de ese perfil
Then recibo sus datos actuales
And si el ID no corresponde a ningún perfil, recibo un error indicando que no existe
```
**Relacionado:** `GET /api/v1/investors/{id}`, `GET /api/v1/companies/{id}`
**Estado:** Implementado.

### HT-02 — Resolver perfil a partir del userId de IAM
**Tipo:** Historia Técnica

**Como** equipo de desarrollo, **quiero** exponer un endpoint que devuelva el `investorId`/`companyId` a partir del `userId` de IAM, **para** que la aplicación cliente pueda ubicar el perfil de un usuario recién autenticado sin depender de una consulta manual a la base de datos.

**Criterios de aceptación (propuestos):**
```gherkin
Given un usuario autenticado con un userId válido de IAM
When la aplicación cliente solicita el perfil asociado a ese userId
Then el servicio devuelve el investorId o companyId correspondiente
And si no existe ningún perfil asociado a ese userId, devuelve un error 404
```
**Relacionado:** endpoint sugerido `GET /api/v1/investors/by-user/{userId}` (y su equivalente para companies).
**Estado:** Planeado.

---

## 3. Documentos KYC (DNI, RUC, foto, logo)

### US-04 — Subir documento de identidad (DNI)
**Tipo:** Historia de Usuario

**Como** inversor, **quiero** subir una foto o escaneo de mi DNI, **para** cumplir con los requisitos de verificación de identidad de la plataforma.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil de inversor existente
When subo mi documento de DNI en un formato soportado (JPEG, PNG o PDF)
Then el documento queda asociado a mi perfil
And puedo ver la referencia de mi documento al consultar mi perfil
```
**Relacionado:** `POST /api/v1/investors/{id}/dni/upload-url` + `PATCH /api/v1/investors/{id}/dni`
**Estado:** Implementado.

### US-05 — Subir foto de perfil
**Tipo:** Historia de Usuario

**Como** inversor, **quiero** subir una foto de perfil, **para** personalizar mi cuenta dentro de la plataforma.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil de inversor existente
When subo una foto en un formato soportado (JPEG o PNG)
Then la foto queda asociada a mi perfil
```
**Relacionado:** `POST /api/v1/investors/{id}/photo/upload-url` + `PATCH /api/v1/investors/{id}/photo`
**Estado:** Implementado.

### US-06 — Subir documento RUC
**Tipo:** Historia de Usuario

**Como** representante de una empresa, **quiero** subir el documento que acredita el RUC de mi empresa, **para** cumplir con los requisitos de verificación legal de la plataforma.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil de empresa existente
When subo el documento de RUC en un formato soportado (JPEG, PNG o PDF)
Then el documento queda asociado al perfil de la empresa
```
**Relacionado:** `POST /api/v1/companies/{id}/ruc/upload-url` + `PATCH /api/v1/companies/{id}/ruc`
**Estado:** Implementado.

### US-07 — Subir logo de la empresa
**Tipo:** Historia de Usuario

**Como** representante de una empresa, **quiero** subir el logo de mi empresa, **para** que se muestre en mi perfil dentro del marketplace.

**Criterios de aceptación:**
```gherkin
Given tengo un perfil de empresa existente
When subo un logo en un formato soportado (JPEG o PNG)
Then el logo queda asociado al perfil de la empresa
```
**Relacionado:** `POST /api/v1/companies/{id}/logo/upload-url` + `PATCH /api/v1/companies/{id}/logo`
**Estado:** Implementado.

### HT-03 — Generar URLs prefirmadas para subida directa a Amazon S3
**Tipo:** Historia Técnica

**Como** equipo de desarrollo, **quiero** generar URLs prefirmadas de un solo uso y con expiración corta para cada archivo a subir, **para** que la aplicación cliente pueda escribir directamente en Amazon S3 sin que profile-service procese el peso del archivo ni exponga las credenciales reales de almacenamiento.

**Criterios de aceptación:**
```gherkin
Given un perfil existente y un tipo de contenido soportado (image/jpeg, image/png, application/pdf)
When se solicita una URL de subida para ese perfil
Then el servicio genera una ruta única para el archivo y una URL firmada válida por 300 segundos
And la URL solo permite escribir en esa ruta específica, no en cualquier otra del bucket
And si el perfil no existe, se devuelve un error 404
And si el tipo de contenido no está soportado, se devuelve un error de validación
```
**Relacionado:** puerto `IFileStorageService`, adaptador `S3FileStorageService`, endpoints `POST .../upload-url`.
**Estado:** Implementado.

### HT-04 — Confirmar y persistir la referencia del documento subido
**Tipo:** Historia Técnica

**Como** equipo de desarrollo, **quiero** un mecanismo para registrar la URL final de un archivo una vez que ya fue subido a Amazon S3, **para** que el perfil quede actualizado solo cuando el archivo realmente existe en el almacenamiento, evitando referencias rotas.

**Criterios de aceptación:**
```gherkin
Given un perfil existente y la URL final de un archivo ya subido a Amazon S3
When se confirma esa URL contra el perfil correspondiente
Then la URL queda persistida como referencia del documento en el perfil
And si el perfil no existe, se devuelve un error 404
```
**Relacionado:** endpoints `PATCH .../dni`, `.../photo`, `.../ruc`, `.../logo`.
**Estado:** Implementado.

---

## 4. Eventos de dominio

### HT-05 — Publicar evento al completar un perfil
**Tipo:** Historia Técnica

**Como** equipo de arquitectura, **quiero** que profile-service publique un evento cuando un perfil termina de completarse, **para** que futuros microservicios (ej. de scoring de riesgo o de habilitación de operaciones) puedan reaccionar sin acoplarse directamente a profile-service.

**Criterios de aceptación:**
```gherkin
Given un inversor o empresa completa exitosamente su perfil
When se persisten los datos del perfil
Then se publica un evento en el tópico "vankoo.profile.events" con eventType "ProfileCompleted", el tipo de perfil, su ID, el userId y el email
And si la publicación del evento falla, el perfil ya guardado no se revierte; el error queda registrado en los logs del servicio
```
**Relacionado:** `IEventPublisherService`, `KafkaEventPublisherService`, tópico `vankoo.profile.events`.
**Nota:** actualmente ningún otro microservicio de la arquitectura consume este evento — se publica dejando la capacidad lista para futuros consumidores.
**Estado:** Implementado.

---

## 5. KYC — verificación

### US-08 — Verificar KYC de un perfil
**Tipo:** Historia de Usuario

**Como** analista de backoffice, **quiero** marcar el perfil de un inversor o empresa como verificado después de revisar sus documentos, **para** habilitarlo a operar en el marketplace.

**Criterios de aceptación (propuestos):**
```gherkin
Given un perfil con documentos de KYC subidos y estado PENDING
When apruebo la verificación de ese perfil
Then el estado del perfil cambia a VERIFIED
And el usuario queda habilitado para operar en el marketplace
```
**Relacionado:** método de dominio `Investor.verifyKyc()` (ya existe pero no está expuesto); falta el equivalente en `Company`, el comando y el endpoint.
**Estado:** Planeado.

### US-09 — Rechazar KYC con motivo
**Tipo:** Historia de Usuario

**Como** analista de backoffice, **quiero** rechazar el KYC de un perfil indicando el motivo del rechazo, **para** que el usuario sepa qué corregir y pueda volver a subir sus documentos.

**Criterios de aceptación (propuestos):**
```gherkin
Given un perfil con documentos de KYC subidos y estado PENDING
When rechazo la verificación de ese perfil e indico un motivo
Then el estado del perfil cambia a REJECTED
And el motivo del rechazo queda registrado y visible para el usuario
```
**Relacionado:** requiere agregar un campo de motivo de rechazo al aggregate/entidad (no existe hoy).
**Estado:** Planeado.

### HT-06 — Publicar evento al cambiar el estado de KYC
**Tipo:** Historia Técnica

**Como** equipo de arquitectura, **quiero** publicar un evento cuando el estado de KYC de un perfil cambia, **para** que otros microservicios (ej. Investment Service) puedan habilitar o bloquear automáticamente las operaciones de ese usuario.

**Criterios de aceptación (propuestos):**
```gherkin
Given el estado de KYC de un perfil cambia a VERIFIED o REJECTED
When se persiste ese cambio de estado
Then se publica un evento correspondiente ("KycVerified" o "KycRejected") en "vankoo.profile.events"
```
**Estado:** Planeado.

---

## 6. Otras funcionalidades identificadas (futuro)

### US-10 — Registrar cuenta bancaria del inversor
**Tipo:** Historia de Usuario

**Como** inversor, **quiero** registrar mi cuenta bancaria, **para** poder recibir el dinero de mis retornos de inversión.

**Criterios de aceptación (propuestos):**
```gherkin
Given tengo un perfil de inversor existente
When registro los datos de mi cuenta bancaria (banco y número de cuenta)
Then la cuenta queda asociada a mi perfil
And puedo consultarla al ver mi perfil
```
**Relacionado:** el dominio (`BankAccount`) y su persistencia ya existen, pero no hay comando ni endpoint que los use.
**Estado:** Planeado.

### US-11 — Marcar empresa como "Factoring Verde"
**Tipo:** Historia de Usuario

**Como** representante de una empresa con prácticas sostenibles, **quiero** que mi perfil se marque como parte del programa "Factoring Verde", **para** acceder a comisiones reducidas y atraer inversionistas con criterios de sostenibilidad (ver Hypothesis 05 del Lean UX de Vankoo).

**Criterios de aceptación (propuestos):**
```gherkin
Given tengo un perfil de empresa que cumple los criterios de sostenibilidad
When solicito que mi empresa sea marcada como "Factoring Verde"
Then mi perfil queda etiquetado como sostenible
And esa etiqueta es visible para los inversionistas en el marketplace
```
**Relacionado:** el VO `SustainabilityStatus` existe en el aggregate `Company`, pero `completeProfile()` nunca lo inicializa y no hay endpoint para actualizarlo.
**Estado:** Planeado.

### HT-07 — Validar `industrySector` contra el enum
**Tipo:** Historia Técnica

**Como** equipo de desarrollo, **quiero** validar el sector industrial recibido contra los valores permitidos del enum `IndustrySector` al completar el perfil de una empresa, **para** evitar que se persistan valores inválidos, ya que hoy solo se hace un cast sin verificación.

**Criterios de aceptación (propuestos):**
```gherkin
Given una empresa completa su perfil indicando un sector industrial
When el valor no corresponde a ninguno de los sectores permitidos
Then la solicitud se rechaza con un error de validación
And el perfil no se modifica
```
**Estado:** Planeado.
