# Prototipe-LMS (Frontend)

Aplicación web frontend para orquestar el flujo de carga académica en LMS, con experiencia visual avanzada, control de vistas por rol (`gif` / `coordinador`), tablero operativo y trazabilidad de solicitudes.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Objetivos del frontend](#objetivos-del-frontend)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura del frontend](#arquitectura-del-frontend)
- [Rutas principales](#rutas-principales)
- [Módulos funcionales](#módulos-funcionales)
- [Gestión de estado global (Zustand)](#gestión-de-estado-global-zustand)
- [Persistencia local de solicitudes](#persistencia-local-de-solicitudes)
- [Modelo de datos](#modelo-de-datos)
- [Flujos de usuario](#flujos-de-usuario)
- [Animaciones y experiencia visual](#animaciones-y-experiencia-visual)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Build y despliegue](#build-y-despliegue)
- [Integración con backend (estado actual)](#integración-con-backend-estado-actual)
- [Guía operativa rápida](#guía-operativa-rápida)
- [Troubleshooting](#troubleshooting)
- [Roadmap técnico sugerido](#roadmap-técnico-sugerido)

---

## Descripción general

`Prototipe-LMS` es un frontend en React + Vite diseñado para validar y demostrar el ciclo operativo de carga de materias:

1. Acceso al sistema
2. Creación de solicitud de carga
3. Gestión por coordinación
4. Seguimiento en pipeline
5. Revisión, actividad e histórico

El proyecto prioriza una experiencia de alto impacto visual con animaciones, transiciones y componentes interactivos, manteniendo una base tipada en TypeScript.

---

## Objetivos del frontend

- Centralizar en una sola UI el proceso de carga LMS de punta a punta.
- Permitir simulación de operación por rol sin depender de backend real.
- Validar UX de navegación, tableros y estados antes de integración final.
- Mantener base técnica escalable para evolucionar de mock a API real.

---

## Stack tecnológico

- **Core:** React 19 + TypeScript
- **Bundling:** Vite 8
- **Routing:** React Router 7
- **Estado global:** Zustand
- **Persistencia local:** Zustand `persist` + `localStorage`
- **Formularios:** React Hook Form + Zod
- **Estilos:** Tailwind CSS 4
- **Animación:** Framer Motion + GSAP + DotLottie
- **Feedback UI:** Sonner (toasts)
- **Iconografía:** Lucide React

---

## Arquitectura del frontend

El frontend está organizado por capas:

- **`app/`**
  - `router`: definición central de rutas.
  - `layouts`: layouts raíz de autenticación y aplicación.
  - `providers`: providers globales (cursor interactivo + toaster).
- **`pages/`**
  - composición de vistas por ruta.
- **`components/`**
  - bloques UI y funcionales por dominio (auth, dashboard, coordinator, submissions, shared, ui).
- **`store/`**
  - estado global con Zustand.
- **`data/`**
  - fuentes mock para procesos, actividad, historial, review queue.
- **`lib/` y `hooks/`**
  - utilidades, constantes, helpers de motion, IDs de navegación y perfiles de animación.

Decisión principal: separar claramente **estado de UI** y **estado de negocio de solicitudes**.

---

## Rutas principales

Definidas en `src/app/router/index.tsx`:

- **Auth**
  - `/login`

- **App**
  - `/` -> redirección a `/dashboard`
  - `/dashboard`
  - `/pipeline`
  - `/submissions/new`
  - `/review`
  - `/review/:id`
  - `/activity`
  - `/history`

---

## Módulos funcionales

### 1) Autenticación y transición de acceso

- `LoginPage` usa `LoginExperience`:
  - fase de boot visual
  - fase de acceso por formulario
  - overlay de autenticación
  - navegación al dashboard con `state` de transición
- `AccessPanel` valida formulario con Zod y define rol:
  - email que contenga `coordinador` -> rol `coordinador`
  - cualquier otro válido -> rol `gif`

### 2) Dashboard principal

`DashboardPage`:

- construye línea de estado dinámica.
- integra hero visual (`DashboardHero`).
- cambia bloque principal según rol:
  - `gif` -> `DriveSubmissionSection`
  - `coordinador` -> `CoordinatorRequestsSection`
- sincroniza navegación por secciones (`hash` + `scroll` + `intersection observer`).

### 3) Cargas GIF

`DriveSubmissionSection`:

- formulario de nueva solicitud (materia, nivel/tipo, drive URL, resumen).
- validación de campos.
- guarda en store global.
- alterna entre:
  - vista de creación
  - vista “Mis solicitudes”.

### 4) Gestión Coordinador

`CoordinatorRequestSection`:

- lista solicitudes creadas por GIF.
- permite expandir detalle.
- acciones de transición:
  - marcar en revisión
  - aprobar
  - rechazar.

### 5) Pipeline operativo

`PipelinePage`:

- render en columnas por estado (`Submitted`, `In Review`, `Requires Finalization`, `Completed`).
- tarjetas con prioridad, owner y acceso al detalle.

### 6) Revisión editorial

- `ReviewPage`: cola tabular de revisión con estado, prioridad y navegación.
- `ReviewDetailPage`: vista puntual por `id`, timeline mock y metadatos.

### 7) Actividad e historial

- `ActivityPage`: timeline de eventos + resumen por tipo.
- `HistoryPage`: archivo de cierres con enlace de material y vista tipo repositorio.

---

## Gestión de estado global (Zustand)

### `useUIStore` (`src/store/uiStore.ts`)

Responsabilidades:

- `userRole`
- estado de búsqueda/filtro global
- proceso seleccionado
- estado de navegación reactiva del dashboard (navbar sobre fondo claro, tab activa por scroll)

### `useRequestsStore` (`src/store/requestsStore.ts`)

Responsabilidades:

- lista de solicitudes compartida entre GIF y Coordinador.
- acciones:
  - `createRequest`
  - `setRequestInReview`
  - `approveRequest`
  - `rejectRequest`

---

## Persistencia local de solicitudes

El store `useRequestsStore` usa middleware `persist`:

- key: `carga-lms-requests`
- storage: `createJSONStorage(() => localStorage)`
- estrategia: `partialize` para persistir solo `requests`

Resultado:

- al crear solicitud se persiste automáticamente.
- al cambiar estado se persiste automáticamente.
- al recargar, el store se hidrata con los datos guardados.

---

## Modelo de datos

Tipos principales en `src/types/index.ts`:

- `UserRole`: `gif` | `coordinador`
- `RequestStatus`: `pendiente` | `aprobado` | `requiere_ajustes`
- `LmsRequest`: entidad de solicitud GIF-Coordinador
- `ProcessItem`: entidad para tableros mock de pipeline/historial
- `ActivityEntry`: entidad de timeline operacional

Notas:

- coexisten estados en español (flujo GIF/Coordinador local) y estados en inglés (pipeline mock visual).
- actualmente son dominios paralelos en una misma app prototipo.

---

## Flujos de usuario

### Flujo GIF

1. Ingresa por `/login`.
2. El rol queda como `gif`.
3. Accede al dashboard.
4. Crea solicitud en “Nueva solicitud”.
5. Visualiza la misma en “Mis solicitudes”.

### Flujo Coordinador

1. Ingresa por `/login` con correo tipo coordinador.
2. El rol queda como `coordinador`.
3. Ve solicitudes compartidas en dashboard.
4. Puede aprobar o solicitar ajustes a las solicitudes pendientes.

### Persistencia

- ambos roles observan el mismo estado de `requestsStore`.
- recargas de página mantienen solicitudes y estado.

---

## Animaciones y experiencia visual

Capas principales:

- Framer Motion para:
  - entrance/exit
  - hover interactions
  - stagger de componentes
- Lottie para:
  - iconografía animada
  - escenas de autenticación y dashboard
- GSAP:
  - registro centralizado de plugins (`ScrollTrigger`) en `src/lib/gsap.ts`
- hooks de control:
  - `useMediaMotionProfile`
  - `useParallaxMouse`

Objetivo UX: experiencia premium sin romper navegación funcional.

---

## Estructura del proyecto

```txt
Prototipe-LMS
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ layouts/
│  │  ├─ providers/
│  │  └─ router/
│  ├─ assets/
│  ├─ components/
│  │  ├─ auth/
│  │  ├─ common/
│  │  ├─ coordinator/
│  │  ├─ dashboard/
│  │  ├─ layout/
│  │  ├─ shared/
│  │  ├─ submissions/
│  │  └─ ui/
│  ├─ data/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  ├─ store/
│  ├─ styles/
│  └─ types/
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

---

## Instalación y ejecución local

### Requisitos

- Node.js (LTS recomendado)
- npm

### Pasos

1. Instalar dependencias:

```bash
npm install
```

2. Levantar entorno local:

```bash
npm run dev
```

3. Abrir URL de Vite:

- `http://localhost:5173` (o siguiente puerto libre)

---

## Build y despliegue

### Build local

```bash
npm run build
```

Esto ejecuta:

- `tsc`
- `vite build`

### Preview de build

```bash
npm run preview
```

---

## Integración con backend (estado actual)

Estado actual:

- autenticación real con Google Identity Services contra el backend.
- solicitudes GIF/Coordinador consumen la API NestJS de materias.
- catálogos de tipos de contenido y semestres se leen desde backend.

Pendiente de integración completa:

- pipeline, actividad, revisión detallada e histórico aún usan datos mock.
- `localStorage` se conserva como cache/hidratación local del store.

---

## Guía operativa rápida

### Probar ciclo completo local

1. Abrir `/login`.
2. Entrar como GIF.
3. Crear 1 o más solicitudes.
4. Cambiar rol a coordinador (nuevo login).
5. Aprobar/rechazar solicitudes.
6. Recargar página y verificar persistencia.

### Limpiar datos del mock persistente

En DevTools Console:

```js
localStorage.removeItem("carga-lms-requests");
```

---

## Troubleshooting

### “Las solicitudes desaparecieron”

- Verificar que la key exista en Local Storage:
  - `carga-lms-requests`
- Confirmar que no se esté limpiando storage al iniciar app.

### “Vite cambió de puerto”

- Ocurre cuando `5173` está ocupado.
- Usar el puerto mostrado por consola (`5174`, etc.).

### “Warnings por assets en /public”

- En Vite, assets de `public` se referencian por URL raíz (`/img/...`, `/videos/...`), no por import desde `/public/...`.

---

## Roadmap técnico sugerido

- Homologar dominio de estados entre vistas de pipeline y flujo GIF/Coordinador.
- Extraer capa `services` para preparar integración con API real.
- Añadir normalización de entidades y selectores memoizados para escalar estado.
- Incorporar tests:
  - unitarios de stores y helpers
  - integración de flujos clave por rol
- Implementar feature flags para activar/desactivar experiencias visuales pesadas por entorno.

---

## Licencia y uso

Uso interno como prototipo funcional de experiencia y validación de flujo operativo de Carga LMS.
