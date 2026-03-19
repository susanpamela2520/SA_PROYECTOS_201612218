# ---------- STAGE 1: Build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# build de producción del proyecto app-web
RUN npm run build -- --configuration production

# ---------- STAGE 2: Serve con Nginx ----------
FROM nginx:alpine

# Limpia contenido default
RUN rm -rf /usr/share/nginx/html/*

# Angular (builder application) suele generar dist/app-web/browser
# Si tu build NO crea /browser, cambia esta línea por dist/app-web
COPY --from=build /app/dist/app-web/browser/ /usr/share/nginx/html/

# SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]