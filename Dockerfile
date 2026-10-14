FROM docker.io/library/node:lts-alpine AS frontend-builder
WORKDIR /app
ARG URL_BASE
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY /package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install
COPY ./ ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/node_modules/.cache \
    npm run build

FROM docker.io/nginx:alpine
ENV API_UPSTREAM=http://host.docker.internal:8004
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
