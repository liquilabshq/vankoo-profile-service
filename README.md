# Vankoo: Profile Service

Microservicio de gestión de perfiles para la plataforma de crowdfactoring **Vankoo**. Desarrollado con NestJS y estructurado para ser escalable y seguro.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* **Node.js**: Recomendada v24 o superior (ver archivo `.nvmrc`)
* **Docker**: Para la gestión de base de datos y servicios locales.
* **Corepack**: Incluido en Node.js para la gestión de pnpm.

> Tip: Si usas nvm, ejecuta `nvm use` para activar la versión correcta automáticamente. Si no la tienes instalada: `nvm install 24`

## Configuración del Entorno

Este proyecto utiliza **pnpm** como gestor de paquetes. Para asegurar que todos usemos la misma versión, utilizamos **Corepack** (incluido en Node.js).

### 1. Instalar y habilitar pnpm

No necesitas instalar pnpm manualmente. Solo asegúrate de habilitar Corepack en tu sistema:

```bash
# Actualiza corepack a la última versión
npm install -g corepack@latest

# Habilita el uso de gestores de paquetes automáticos
corepack enable
```

### 2. Instalar dependencias

Una vez habilitado, simplemente corre:

```bash
pnpm install
```

Corepack detectará automáticamente la versión de pnpm definida en el `package.json` y la descargará por ti.

> Nota: Si aparece un aviso de "Ignored build scripts", ejecuta `pnpm approve-builds` para permitir los scripts de configuración de NestJS.

### 3. Variables de Entorno

Copia el archivo de ejemplo `.env.example` a `.env` y ajusta las variables según tu entorno local:

```bash
cp .env.example .env
```

El proyecto usa `@nestjs/config` para cargar el archivo `.env` automáticamente al arrancar (`ConfigModule`), por lo que basta con que el archivo exista en la raíz del proyecto antes de ejecutar `pnpm run start` / `start:dev`. No es necesario exportar las variables manualmente en la terminal.

Estas son las variables disponibles:

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `PROFILE_DB_HOST` | Host de la base de datos Postgres | — |
| `PROFILE_DB_PORT` | Puerto de la base de datos Postgres | — |
| `PROFILE_DB_USER` | Usuario de la base de datos | — |
| `PROFILE_DB_PASS` | Contraseña de la base de datos | — |
| `PROFILE_DB_NAME` | Nombre de la base de datos | — |
| `STORAGE_PROVIDER` | Proveedor de almacenamiento a usar: `minio` o `s3` | `minio` |
| `MINIO_ENDPOINT` | Host del servidor MinIO (S3-compatible) | `localhost` |
| `MINIO_PORT` | Puerto del servidor MinIO | `9100` |
| `MINIO_USE_SSL` | `true`/`false`, si la conexión a MinIO usa HTTPS | `false` |
| `MINIO_ACCESS_KEY` | Access key de MinIO | — |
| `MINIO_SECRET_KEY` | Secret key de MinIO | — |
| `MINIO_BUCKET_NAME` | Bucket donde se almacenan los documentos/fotos (MinIO) | `vankoo-profile-documents` |
| `MINIO_PRESIGNED_EXPIRY_SECONDS` | Segundos de validez de las URLs firmadas de subida (MinIO) | `300` |
| `AWS_REGION` | Región de AWS donde vive el bucket (solo si `STORAGE_PROVIDER=s3`) | `us-east-1` |
| `AWS_S3_BUCKET` | Bucket donde se almacenan los documentos/fotos (S3) | `vankoo-profile-documents` |
| `AWS_ACCESS_KEY_ID` | Access key del usuario IAM con permisos sobre el bucket | — |
| `AWS_SECRET_ACCESS_KEY` | Secret key del usuario IAM con permisos sobre el bucket | — |
| `AWS_S3_PRESIGNED_EXPIRY_SECONDS` | Segundos de validez de las URLs firmadas de subida (S3) | `300` |
| `AWS_S3_PUBLIC_URL` *(opcional)* | URL pública base para construir el `fileUrl` final. Si no se define, se calcula como `https://<bucket>.s3.<region>.amazonaws.com` | — |

**Ejemplo de `.env.example`:**

```bash
# Base de datos (Postgres)
PROFILE_DB_HOST=localhost
PROFILE_DB_PORT=5432
PROFILE_DB_USER=vankoo
PROFILE_DB_PASS=vankoo
PROFILE_DB_NAME=vankoo_profiles

# Almacenamiento de archivos: STORAGE_PROVIDER elige entre minio (default, desarrollo local) y s3
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9100
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=vankoo-profile-documents
MINIO_PRESIGNED_EXPIRY_SECONDS=300
```

## Ejecución del Proyecto

### Desarrollo

Para levantar el servidor de forma normal:

```bash
pnpm run start
```

Para levantar el servidor con hot-reload (recarga automática al guardar):

```bash
pnpm run start:dev
```

### Producción

Para compilar el proyecto y luego ejecutarlo en modo producción:

```bash
pnpm build
pnpm start:prod
```

### Docker

El proyecto incluye un `Dockerfile` multi-stage: una etapa `builder` que instala dependencias y compila el proyecto (`pnpm run build`), y una etapa final ligera (`node:24-alpine`) que solo copia el código ya compilado (`dist`) e instala las dependencias de producción.

1. Construir la imagen:

   ```bash
   docker build -t vankoo-profile-service .
   ```

2. Ejecutar el contenedor, pasando las variables de entorno desde tu `.env` local:

   ```bash
   docker run --env-file .env -p 3000:3000 vankoo-profile-service
   ```

   El contenedor expone el puerto `3000` (definido en el `Dockerfile` con `EXPOSE 3000`).

> Nota: Este repositorio no incluye aún un `docker-compose.yml` para levantar el servicio junto a sus dependencias (Postgres, MinIO). Si necesitas ese flujo localmente, puedes crear uno que defina los servicios `profile-service`, `postgres` y `minio`, o levantar esas dependencias por separado y apuntar las variables `PROFILE_DB_*` / `MINIO_*` de tu `.env` hacia ellas. Para usar Amazon S3 en vez de MinIO, define `STORAGE_PROVIDER=s3` junto con las variables `AWS_*` — no requiere ningún contenedor local.

## Pruebas (Testing)

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## Configuración en WebStorm

### Ejecución desde el IDE

Si usas **WebStorm**, puedes configurar la ejecución del proyecto directamente desde el IDE para facilitar el desarrollo:

1. En la parte superior derecha, despliega el menú de configuraciones y haz click en "Edit Configurations...".

   ![img.png](/docs/images/webstorm-step-1.png)

2. Luego, haz click en el botón "+" y selecciona "npm" (aunque uses pnpm, WebStorm usa esta plantilla).

   ![img_1.png](/docs/images/webstorm-step-2.png)

3. Configura los campos así:

   - Name: `Vankoo: Profiles (Dev)`
   - Command: `run`
   - Scripts: `start:dev` (Este es el modo watch que reinicia el servidor cuando guardas cambios).
   - Package manager: `pnpm`

   ![img_2.png](/docs/images/webstorm-step-3.png)

4. Haz click en "Apply" y luego en "OK".

Puedes hacer lo mismo para tests unitarios o e2e, creando nuevas configuraciones con los comandos `test` o `test:e2e`.

### Establecer el Package Manager

Para asegurarte de que WebStorm use **pnpm** en lugar de **npm**:

1. Ve a `File > Settings` (o `WebStorm > Settings` en macOS).
2. Navega a `Languages & Frameworks > JavaScript Runtime`.
3. En la sección "Package manager", selecciona `pnpm` en lugar de `npm`.

   ![img_3.png](/docs/images/webstorm-step-4.png)

## Arquitectura del Microservicio

El proyecto sigue una estructura modular de NestJS orientada a dominios:

```text
src/
├── profiles/           # Profile Context
│   ├── domain/         # Capa 1: Reglas de negocio (Entidades, Agregados)
│   ├── application/    # Capa 2: Casos de uso (CreateProfile, UpdateProfile)
│   ├── infrastructure/ # Capa 3: Persistencia (Postgres) y Mensajería (Kafka)
│   └── interfaces/     # Capa 4: Controladores REST y DTOs
├── app.module.ts
└── main.ts
```

### Patrón de subida de archivos: Presigned URL

Para subir archivos (foto de inversor, DNI, logo de empresa, RUC), el servicio **no recibe el binario del archivo directamente**. En su lugar usa el patrón de **URL prefirmada (presigned URL)** contra el proveedor de almacenamiento de objetos activo (MinIO en local, o Amazon S3 según `STORAGE_PROVIDER`), en dos pasos:

1. **Solicitar la URL de subida** — `POST /:id/photo/upload-url` (o `/dni/upload-url`, `/logo/upload-url`, `/ruc/upload-url`).
   El backend (puerto `IFileStorageService.generateUploadUrl`, implementado por [minio-file-storage.service.ts](src/profiles/infrastructure/storage/minio-file-storage.service.ts) o [s3-file-storage.service.ts](src/profiles/infrastructure/storage/s3-file-storage.service.ts) según `STORAGE_PROVIDER` — ver [storage.module.ts](src/profiles/infrastructure/storage/storage.module.ts)) pide una URL temporal firmada, válida por `MINIO_PRESIGNED_EXPIRY_SECONDS`/`AWS_S3_PRESIGNED_EXPIRY_SECONDS` segundos según corresponda. La respuesta incluye:
   - `uploadUrl`: URL firmada a la que el cliente debe subir el archivo directamente (por ejemplo, con un `PUT`).
   - `fileUrl`: la URL pública final donde quedará accesible el archivo una vez subido.
   - `expiresInSeconds`: tiempo de validez de `uploadUrl`.

2. **Subir el archivo directamente al storage** desde el cliente (frontend/mobile), usando `uploadUrl`. El archivo **no pasa por este microservicio**, lo que evita cargar el backend con el tráfico de los binarios.

3. **Confirmar la subida** — `POST /:id/photo` (o `/dni`, `/logo`, `/ruc`) enviando el `fileUrl` obtenido en el paso 1. El backend valida la URL (`@IsUrl`) y actualiza el agregado correspondiente (inversor o empresa) con la referencia final.

Este patrón evita exponer las credenciales de almacenamiento al cliente y mantiene el microservicio desacoplado del tráfico pesado de archivos.

## Estándares de Código

### Estilo

El proyecto usa ESLint y Prettier. WebStorm los detectará automáticamente.