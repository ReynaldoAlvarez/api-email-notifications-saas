# Multi-stage build para mayor seguridad
FROM node:20-alpine3.19 AS builder

WORKDIR /app

# Instalar dependencias de build
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Copiar código fuente
COPY . .

# Generar cliente de Prisma y compilar
RUN npx prisma generate && npm run build

# Etapa de producción con imagen mínima
FROM node:20-alpine3.19 AS production

# Actualizar paquetes para seguridad
RUN apk update && apk upgrade && \
    apk add --no-cache openssl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copiar solo archivos necesarios desde builder
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]