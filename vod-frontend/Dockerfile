# Alap image
FROM node:18 AS build
WORKDIR /app

# Függőségek másolása és telepítése
COPY package.json package-lock.json ./
RUN npm install

# Angular alkalmazás buildelése
COPY . .
RUN npm run build --prod

# 2. Nginx szakasz
FROM nginx:stable-alpine

# Opciós Nginx konfiguráció
COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build app/dist/vod-frontend/browser /usr/share/nginx/html

# Konténer folyamatos futtatása
CMD ["nginx", "-g", "daemon off;"]
