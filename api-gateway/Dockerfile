# NGINX alap image
FROM nginx:stable-alpine

# NGINX konfiguráció bemásolása
COPY nginx.conf /etc/nginx/nginx.conf

# Konténer folyamatos futtatása
CMD ["nginx", "-g", "daemon off;"]