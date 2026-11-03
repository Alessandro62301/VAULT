# Landing da mariadamavi: build estático do Vite servido pelo nginx.
# Não inclui painel/ nem commerce/ (ver .dockerignore).

# build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
COPY v2 ./v2
COPY scripts ./scripts
RUN npm run build

# serve
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/deployment/security-headers.conf /etc/nginx/snippets/mariadamavi-security.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN nginx -t
EXPOSE 80
