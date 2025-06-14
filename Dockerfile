# Dockerfile
FROM node:20.13.1-alpine

# Instalar pnpm
RUN npm install -g pnpm

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de pnpm
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN pnpm prisma:generate

# Construir la aplicación
RUN pnpm build

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["pnpm", "start"]