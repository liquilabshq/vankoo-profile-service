# Vankoo: ProfileAggregate Service

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
├── profiles/           # ProfileAggregate Context
│   ├── domain/         # Capa 1: Reglas de negocio (Entidades, Agregados)
│   ├── application/    # Capa 2: Casos de uso (CreateProfile, UpdateProfile)
│   ├── infrastructure/ # Capa 3: Persistencia (Postgres) y Mensajería (Kafka)
│   └── interfaces/     # Capa 4: Controladores REST y DTOs
├── app.module.ts
└── main.ts
```

## Estándares de Código

### Estilo

El proyecto usa ESLint y Prettier. WebStorm los detectará automáticamente.

## agregar como usar las variables de entorno en local y como configurar
## .env example
### como correrlo en docker
## modifcar el docker compose 