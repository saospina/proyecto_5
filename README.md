# Proyecto 5 — Users API (Node.js + Express + PostgreSQL + Azure)

API REST de gestión de usuarios (CRUD) contenerizada con Docker, con base de datos PostgreSQL, documentación Swagger, tests unitarios y de integración, y pipeline CI/CD en Azure Pipelines que despliega automáticamente en **Azure Container Apps** desde **Azure Container Registry (ACR)**.

## Modelo de datos

Tabla `users` (se crea automáticamente al arrancar la aplicación):

| Campo        | Tipo         | Descripción            |
|--------------|--------------|------------------------|
| `id`         | SERIAL (PK)  | Identificador          |
| `first_name` | VARCHAR(100) | Nombre (obligatorio)   |
| `last_name`  | VARCHAR(100) | Apellido (obligatorio) |
| `city`       | VARCHAR(100) | Ciudad                 |
| `address`    | VARCHAR(200) | Dirección              |
| `profession` | VARCHAR(100) | Profesión              |
| `created_at` | TIMESTAMPTZ  | Fecha de creación      |

## Endpoints

| Método | Ruta             | Descripción                          |
|--------|------------------|--------------------------------------|
| GET    | `/health`        | Estado del servicio y de la BD       |
| GET    | `/api/users`     | Lista todos los usuarios             |
| GET    | `/api/users/:id` | Obtiene un usuario                   |
| POST   | `/api/users`     | Crea un usuario                      |
| PUT    | `/api/users/:id` | Actualiza un usuario (parcial)       |
| DELETE | `/api/users/:id` | Elimina un usuario                   |
| GET    | `/api-docs`      | Documentación Swagger con ejemplos   |

## Estructura del proyecto

```
├── src/
│   ├── index.js               # Punto de entrada (arranque + init BD)
│   ├── app.js                 # App Express (rutas, Swagger, /health)
│   ├── config/db.js           # Pool de PostgreSQL + creación de tabla
│   ├── controllers/           # Lógica de los endpoints
│   ├── models/                # Consultas SQL (capa de datos)
│   ├── routes/                # Rutas + anotaciones OpenAPI
│   └── docs/swagger.js        # Configuración de swagger-jsdoc
├── tests/
│   ├── unit/                  # Tests unitarios (modelo mockeado)
│   └── integration/           # Tests de integración (BD real)
├── Dockerfile
├── docker-compose.yml
├── azure-pipelines.yml        # Pipeline CI/CD
└── .env.example
```

## Configuración (.env)

Copia `.env.example` a `.env` y ajusta los valores. **El `.env` nunca se sube al repositorio** (está en `.gitignore`).

```env
# Local (docker compose)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/usersdb
# Producción (Render)
# DATABASE_URL=postgres://<user>:<password>@<host>.render.com:5432/<database>
PORT=3000
```

Si el host contiene `render.com`, la conexión usa SSL automáticamente. Para otros proveedores gestionados, añade `PGSSL=true`.

## Ejecución local

### Con Docker Compose (recomendado)

```bash
docker compose up --build
```

Levanta la API en `http://localhost:3000` y un PostgreSQL local. Para usar la base de datos de Render en su lugar, exporta `RENDER_DATABASE_URL` (o añádela al `.env`) antes de ejecutar compose.

### Sin Docker

```bash
docker compose up -d db     # solo la base de datos
npm install
npm run dev
```

## Tests

```bash
npm run test:unit           # unitarios (no necesitan BD)
docker compose up -d db     # BD para los de integración
npm test                    # unitarios + integración
```

- **Unitarios** (`tests/unit`): prueban los controladores con el modelo mockeado (códigos 200/201/204/400/404/500).
- **Integración** (`tests/integration`): prueban el ciclo CRUD completo por HTTP contra un PostgreSQL real, incluida la verificación de conexión a la BD (`/health`).

## Base de datos en Render

1. En [Render](https://render.com) crea un servicio **PostgreSQL** (plan free).
2. Copia la **External Database URL**.
3. Úsala como `DATABASE_URL` en el `.env` local y en la configuración de Azure Container Apps.

## Despliegue manual en Azure

### 1. Crear el ACR y subir la imagen

```bash
az group create --name rg-proyecto5 --location westeurope
az acr create --resource-group rg-proyecto5 --name <tu_acr> --sku Basic

az acr login --name <tu_acr>
docker build -t my-backend:v1 .
docker tag my-backend:v1 <tu_acr>.azurecr.io/my-backend:v1
docker push <tu_acr>.azurecr.io/my-backend:v1
```

### 2. Crear la Container App

```bash
az containerapp env create \
  --name proyecto5-env \
  --resource-group rg-proyecto5 \
  --location westeurope

az containerapp create \
  --name my-backend \
  --resource-group rg-proyecto5 \
  --environment proyecto5-env \
  --image <tu_acr>.azurecr.io/my-backend:v1 \
  --registry-server <tu_acr>.azurecr.io \
  --target-port 3000 \
  --ingress external \
  --secrets database-url='<DATABASE_URL de Render>' \
  --env-vars DATABASE_URL=secretref:database-url PORT=3000
```

> **Seguridad**: la cadena de conexión se guarda como **secret** de la Container App y se inyecta por referencia (`secretref`), nunca en texto plano ni en el repositorio.

### 3. Validar el despliegue

```bash
# URL pública de la aplicación
az containerapp show --name my-backend --resource-group rg-proyecto5 \
  --query properties.configuration.ingress.fqdn -o tsv

# Prueba de conexión a la base de datos desde la aplicación
curl https://<fqdn>/health
# -> {"status":"ok","database":"connected"}

# Logs de la aplicación
az containerapp logs show --name my-backend --resource-group rg-proyecto5 --follow
```

## CI/CD con Azure Pipelines

El pipeline (`azure-pipelines.yml`) se ejecuta en cada push a `main` con tres etapas:

1. **Test** — instala dependencias, levanta un PostgreSQL efímero en Docker y ejecuta los tests unitarios y de integración.
2. **Build** — construye la imagen Docker y la sube al ACR con las etiquetas `latest` y el número de build.
3. **Deploy** — actualiza la Container App con la nueva imagen (`az containerapp update`).

### Configuración necesaria en Azure DevOps

1. Crea un proyecto en Azure DevOps y conecta el repositorio de **GitHub** (Pipelines → New pipeline → GitHub → selecciona este repo; detecta `azure-pipelines.yml`).
2. Crea dos *service connections* (Project Settings → Service connections):
   - `acr-service-connection` — tipo **Docker Registry**, apuntando al ACR.
   - `azure-service-connection` — tipo **Azure Resource Manager**, con acceso a la suscripción.
3. Ajusta las variables del pipeline (`acrName`, `resourceGroup`, `containerAppName`) a tus recursos.

## Buenas prácticas aplicadas

- Credenciales fuera del código: `.env` ignorado por git, `.env.example` como plantilla, secrets de Container Apps en producción.
- Consultas SQL parametrizadas (`$1, $2, …`) contra inyección SQL.
- Imagen Docker mínima (`node:20-alpine`), solo dependencias de producción, usuario no root.
- SSL en la conexión a la base de datos gestionada (Render).
- Healthcheck de la BD en compose y endpoint `/health` para monitorización.
- Pipeline con puertas: no se publica ni despliega si los tests fallan.
