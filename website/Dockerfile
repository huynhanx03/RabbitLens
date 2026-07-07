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
ENV RABBITMQ_MANAGEMENT_SCHEME=http \
    RABBITMQ_MANAGEMENT_HOST=rabbitmq \
    RABBITMQ_MANAGEMENT_PORT=15672 \
    RABBITLENS_DNS_RESOLVER=127.0.0.11 \
    RABBITLENS_DNS_TTL=10s \
    RABBITLENS_DNS_IPV6=off

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
