# NestJS

NestJS es un framework de Node.js para construir aplicaciones del lado del servidor. Está construido con TypeScript y se basa en principios de diseño como la modularidad, la inyección de dependencias y la programación orientada a objetos. NestJS es ideal para desarrollar aplicaciones escalables y mantenibles, y es compatible con una amplia variedad de bibliotecas y herramientas del ecosistema de Node.js.

## NestJS CLI

NestJS CLI es una herramienta de línea de comandos que facilita la creación y gestión de proyectos NestJS. Con esta herramienta, puedes generar rápidamente módulos, controladores, servicios y otros recursos necesarios para tu aplicación.

La CLI de NestJS se puede instalar globalmente usando npm o pnpm:

```bash
npm install -g @nestjs/cli
```

Sin embargo, también se puede usar directamente el comando `npx` para crear un nuevo proyecto sin necesidad de instalar la CLI globalmente:

```bash
npx @nestjs/cli vankoo-profile-service
```

Además, una vez dentro de tu proyecto, puedes generar nuevos recursos como módulos, controladores y servicios utilizando la CLI. Por ejemplo, para generar un nuevo recurso llamado "profiles":

```bash
nest generate resource profiles
```

Igualmente, si no tienes la CLI instalada globalmente, puedes usar `npx` para generar el recurso:

```bash
npx nest generate resource profiles
```