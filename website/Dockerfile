# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.17.0-alpine3.23
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.28.1-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ${NGINX_IMAGE} AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
