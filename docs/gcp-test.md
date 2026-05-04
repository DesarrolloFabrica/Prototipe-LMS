# GCP Test Environment

Este frontend se despliega como contenedor estatico en Cloud Run.

## Comunicacion con backend

El navegador llama directamente al backend usando la variable de build:

```env
VITE_API_BASE_URL=https://BACKEND_TEST_URL/api
```

En GitHub Actions esa variable se pasa como build arg:

```txt
BACKEND_API_BASE_URL_TEST=https://BACKEND_TEST_URL/api
```

El backend debe permitir CORS desde la URL del frontend:

```env
CORS_ORIGIN=https://FRONTEND_TEST_URL
```

## GitHub Actions

El repo usa `.github/workflows/deploy-test.yml`.

Variables de GitHub del repo frontend:

```txt
GCP_PROJECT_ID_TEST
GCP_REGION_TEST
GCP_ARTIFACT_REPOSITORY_TEST
CLOUD_RUN_FRONTEND_SERVICE_TEST
BACKEND_API_BASE_URL_TEST
GOOGLE_CLIENT_ID_TEST
```

Secrets de GitHub del repo frontend:

```txt
GCP_WORKLOAD_IDENTITY_PROVIDER_TEST
GCP_SERVICE_ACCOUNT_TEST
```

## Importante

Las variables `VITE_*` quedan embebidas en el bundle del navegador. No pongas secretos en variables `VITE_*`.
