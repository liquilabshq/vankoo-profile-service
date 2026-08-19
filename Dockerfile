# Etapa 1: Instalación y Compilación (Builder)
FROM node:24-alpine AS builder
WORKDIR /app

# Instalamos pnpm globalmente (versión fijada para que coincida con "packageManager" en package.json)
RUN npm install -g pnpm@10.30.2

# Copiamos los archivos de dependencias primero (aprovecha la caché)
COPY package.json pnpm-lock.yaml ./

# Instalamos TODAS las dependencias (incluyendo las de desarrollo para compilar)
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código fuente (Gracias al .dockerignore, esto es instantáneo)
COPY . .

# Compilamos el proyecto NestJS (genera la carpeta /dist)
RUN pnpm run build

# Etapa 2: Runtime (Imagen final súper ligera)
FROM node:24-alpine
WORKDIR /app

# Instalamos curl y pnpm como root (versión fijada para que coincida con "packageManager" en package.json)
RUN apk add --no-cache curl && npm install -g pnpm@10.30.2

# Le damos la propiedad de la carpeta /app al usuario node
RUN chown -R node:node /app

# Ahora sí, nos cambiamos al usuario seguro
USER node

# Copiamos los archivos de configuración
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Instalamos SOLO las dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiamos ÚNICAMENTE el código ya compilado desde la Etapa 1
COPY --chown=node:node --from=builder /app/dist ./dist

# Exponemos el puerto de la API de perfiles
EXPOSE 3000

# Ejecutamos la app compilada
CMD ["node", "dist/main.js"]