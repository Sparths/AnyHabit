# The build output (static files in /app/dist) is architecture-independent, so
# the builder always runs on the build host's native platform. This keeps
# multi-arch builds from running npm under QEMU emulation, which is slow and
# crashes Node on arm64 ("qemu: uncaught target signal 4 (Illegal instruction)").
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Installed as a template so nginx substitutes ${BACKEND_HOST} at startup,
# which is what makes the backend hostname configurable.
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost/ || exit 1
