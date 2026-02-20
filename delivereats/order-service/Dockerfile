# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código y construimos el proyecto
COPY . .
RUN npm run build

# Etapa 2: Ejecución (Imagen ligera)
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario desde la etapa de builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Exponemos el puerto (esto es informativo, se define en el compose)
EXPOSE 3000

# Comando para arrancar el microservicio
CMD ["npm", "run", "start:prod"]