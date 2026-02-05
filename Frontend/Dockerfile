FROM node:18-alpine

WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el código
COPY . .

# Expone el puerto de Vite
EXPOSE 5173

# Comando para correr en modo desarrollo
CMD ["npm", "run", "dev"]