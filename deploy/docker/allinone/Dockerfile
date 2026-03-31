FROM --platform=$BUILDPLATFORM golang:1.24.1 AS builder

WORKDIR /app

# Configure Go to use China proxy for faster downloads
ENV GOPROXY=https://goproxy.cn,direct

COPY go.mod go.sum ./

RUN go mod download

COPY . .

ARG TARGETOS
ARG TARGETARCH

# Disable CGO to build static binaries (avoids pthread_create permission issues in containers)
ENV CGO_ENABLED=0

RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o /app/bin/apiserver ./cmd/apiserver
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o /app/bin/mcp-gateway ./cmd/mcp-gateway
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o /app/bin/mock-server ./cmd/mock-server

FROM node:20.18.0 AS web-builder


WORKDIR /app/web

COPY web/ .

RUN npm install -g pnpm@9.15.0
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM ghcr.io/amoylab/unla/base:latest AS runtime

ARG PIP_INDEX_URL=https://pypi.org/simple
ARG UV_DEFAULT_INDEX=https://pypi.org/simple
ARG pnpm_config_registry=https://registry.npmjs.org/

ENV PIP_INDEX_URL=${PIP_INDEX_URL} \
    UV_DEFAULT_INDEX=${UV_DEFAULT_INDEX} \
    pnpm_config_registry=${pnpm_config_registry}

# Configure pip and pnpm to use the specified repositories
RUN mkdir -p /root/.config/pip && \
    echo "[global]\nindex-url = \${PIP_INDEX_URL}" > /root/.config/pip/pip.conf && \
    npm install -g pnpm@9.15.0 && \
    pnpm config set registry ${pnpm_config_registry} -g

COPY deploy/docker/allinone/supervisord.conf /etc/supervisor/conf.d/
COPY deploy/docker/allinone/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /app/data
COPY configs/apiserver.yaml /etc/unla/
COPY configs/mcp-gateway.yaml /etc/unla/
COPY configs/i18n /etc/unla/i18n

COPY --from=builder /app/bin/mcp-gateway /usr/local/bin/
COPY --from=builder /app/bin/mock-server /usr/local/bin/
COPY --from=builder /app/bin/apiserver /usr/local/bin/
COPY --from=builder /app/assets /app/assets

COPY --from=web-builder /app/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]