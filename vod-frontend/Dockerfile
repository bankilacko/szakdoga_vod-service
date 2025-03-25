# Alap image
FROM node:18 AS build
WORKDIR /app

# Függőségek másolása és telepítése
COPY package.json package-lock.json ./
RUN npm install

# Angular alkalmazás buildelése
COPY . .
RUN npm run build --prod

