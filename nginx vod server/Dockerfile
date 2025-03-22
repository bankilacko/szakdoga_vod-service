# NGINX image
FROM nginx:latest

# Egyéni NGINX konfiguráció átmásolása
COPY nginx_vod.conf /etc/nginx/nginx.conf

# VOD mappa létrehozása
RUN mkdir -p /usr/share/nginx/html/vod && chmod -R 755 /usr/share/nginx/html/vod

# Teszt videók másolása
COPY output.m3u8 /usr/share/nginx/html/vod
COPY output0.ts /usr/share/nginx/html/vod
COPY output1.ts /usr/share/nginx/html/vod

# HTTP port exponálása
EXPOSE 8080

# NGINX indítása
CMD ["nginx", "-g", "daemon off;"]

