# Server2 - API REST de productos

API REST en Node.js, Express y PostgreSQL para la base existente `BDDProductos`,
con Prisma ORM en la capa de acceso a datos.
No crea ni modifica la base, la tabla o los productos existentes. La conexión
espera la tabla `productos` y las columnas sin comillas `idproducto`,
`pronombre`, `procategoria` y `propvp` (la forma habitual de PostgreSQL para el
DDL `Productos` de la especificación). Ejecuta `database.sql` en `BDDProductos`
para verificar el esquema antes de iniciar la API.

## Inicio

1. Revisa las variables locales de `.env` (se excluye de Git). Se carga desde
   la raíz del proyecto independientemente del directorio desde donde ejecutes
   Node. `.env.example` sirve como plantilla y no contiene credenciales reales.
2. Instala dependencias con `npm install`.
3. Genera el cliente ORM con `npm run prisma:generate`.
4. Inicia en modo desarrollo con `npm run dev`, o con `npm start`.

El servidor escucha en `http://localhost:5051`, prueba la conexión a PostgreSQL
antes de aceptar peticiones y falla explícitamente si la base no está disponible.

## Panel web de pruebas

El cliente estático, sin frameworks ni dependencias, se encuentra en
`frontend-client/`. Inicia el backend (`npm start`) y sirve la carpeta con Live
Server en el puerto `5500` o `3000`, ambos habilitados en CORS. Como alternativa,
desde la raíz ejecuta `npx serve frontend-client --listen 3000` y abre
`http://localhost:3000`. No abras `index.html` con el protocolo `file://`.

El panel corresponde a las columnas reales de la API (`idProducto`,
`proNombre`, `proCategoria`, `proPvp`); descripción, stock y activo no son campos
del esquema actual. Permite listar y paginar, buscar por ID, crear, reemplazar,
actualizar un campo y eliminar productos. La consola muestra el estado HTTP,
el JSON y, para escrituras, la cabecera `X-Product-Integrity`.

## Endpoints

Prefijo por defecto: `/api/v1`.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/productos?page=1` | Lista hasta 1000 productos con `total`, `page`, `limit` y `data`. |
| GET | `/productos/:id` | Obtiene un producto por `idProducto`. |
| POST | `/productos` | Crea un producto. Requiere los cuatro campos. |
| PUT | `/productos/:id` | Reemplaza nombre, categoría y precio; el ID del body debe coincidir con la ruta. |
| PATCH | `/productos/:id` | Actualiza uno o más de nombre, categoría y precio. |
| DELETE | `/productos/:id` | Elimina el producto. |

Ejemplo de body para `POST` y `PUT`:

```json
{
  "idProducto": "AB123456789",
  "proNombre": "Producto de prueba",
  "proCategoria": "General",
  "proPvp": 12.5
}
```

Los precios deben ser positivos, numéricos y tener como máximo dos decimales.
Para `PATCH`, envía al menos uno de `proNombre`, `proCategoria` o `proPvp`.
El listado usa páginas de 1000 registros; `?page=2` devuelve el siguiente bloque.
Los endpoints de creación/actualización incluyen un HMAC del contenido aceptado
en la cabecera `X-Product-Integrity`; su clave se configura mediante
`HASH_SECRET_SALT`.

## Thunder Client

Configura una colección con la variable `baseUrl` = `http://localhost:5051/api/v1`.

```http
GET {{baseUrl}}/productos?page=1
GET {{baseUrl}}/productos/AB123456789
POST {{baseUrl}}/productos
Content-Type: application/json

{
  "idProducto": "AB123456789",
  "proNombre": "Producto de prueba",
  "proCategoria": "General",
  "proPvp": 12.5
}
```

```http
PUT {{baseUrl}}/productos/AB123456789
Content-Type: application/json

{
  "idProducto": "AB123456789",
  "proNombre": "Producto actualizado",
  "proCategoria": "General",
  "proPvp": 15
}
```

```http
PATCH {{baseUrl}}/productos/AB123456789
Content-Type: application/json

{
  "proPvp": 14.99
}
```

```http
DELETE {{baseUrl}}/productos/AB123456789
```

Las respuestas de error comparten el formato
`{"error":{"code":"...","message":"..."}}`. Prisma gestiona las consultas de la
capa de repositorio y la sanitización recorta espacios y elimina bytes nulos
sin alterar caracteres legítimos del catálogo.

## Prisma ORM

El modelo está definido en `prisma/schema.prisma` y mapea la tabla existente
`public.productos`; no ejecutes `prisma migrate` ni `prisma db push` para esta
base. La tabla actual no declara una clave primaria, por lo que `idProducto`
está marcado como `@id` en el modelo Prisma para habilitar las operaciones por
ID. Se comprobó que los 10.000 IDs existentes son únicos y no nulos. La cadena
`DATABASE_URL` se construye a partir de las variables `DB_*` del `.env`. Prisma
usa el adaptador PostgreSQL y el pool sigue configurable mediante `DB_MAX_POOL`
y `DB_IDLE_TIMEOUT`.

## Despliegue de prueba en Render

`render.yaml` define la API y una base PostgreSQL gratuita. El plan gratuito de
la base es temporal y puede caducar; úsalo solo para pruebas. El backend
crea/aplica el esquema Prisma en la base Render al iniciarse, no en la base
local. El frontend se publica en GitHub Pages desde GitHub Actions y la API
permite su origen `https://andrey1890.github.io` mediante CORS.

El workflow `.github/workflows/ci-cd.yml` valida el esquema, genera Prisma,
construye el frontend, ejecuta la auditoría npm y escanea secretos. En los
pushes validados a `main` o `master`, publica `frontend-client/dist` en GitHub
Pages y, si está configurado `RENDER_API_DEPLOY_HOOK`, despliega la API en
Render. Render genera `HASH_SECRET_SALT` y proporciona `DATABASE_URL`; no
guardes esas credenciales en el repositorio.

Pasos: habilita **Settings → Pages → Source: GitHub Actions** si Pages no está
configurado todavía; en Render crea un **Blueprint Instance** desde este repo
y confirma la API y PostgreSQL; guarda el Deploy Hook de la API como el secreto
`RENDER_API_DEPLOY_HOOK` en **Settings → Secrets and variables → Actions**. El
workflow tiene los permisos `pages: write` e `id-token: write` para publicar
Pages. No se requiere ningún secreto ni servicio de Supabase. Si la rama
principal del repo es `master`, selecciónala también en el Blueprint.

La URL esperada del frontend es
`https://andrey1890.github.io/flujocompleto/`. El frontend usa la API pública
`https://server2-productos-api.onrender.com/api/v1/productos`; asegúrate de que
el servicio API tenga ese hostname en Render y actualiza `API_BASE_URL` en el
workflow si Render asigna uno diferente. En Render, verifica también que
`CORS_ORIGIN` coincida con el origen real de Pages.

### Migrar los productos existentes

Después de crear los recursos de Render, confirma que la aplicación ha creado
la tabla vacía. Copia temporalmente la cadena externa de conexión de Render a
la variable `RENDER_DATABASE_URL` en tu terminal local y ejecuta
`npm run db:migrate-products`. El script lee PostgreSQL local mediante `.env`,
requiere que la tabla remota esté vacía, inserta en una transacción y compara
los conteos; si la tabla remota ya tiene filas, se detiene sin modificarlas.
No pegues la URL en comandos guardados ni la compartas.

En PowerShell puedes pedir la URL sin mostrarla en pantalla:

```powershell
$secureUrl = Read-Host "Render external PostgreSQL URL" -AsSecureString
$env:RENDER_DATABASE_URL = [System.Net.NetworkCredential]::new("", $secureUrl).Password
npm run db:migrate-products
Remove-Item Env:RENDER_DATABASE_URL
```

El workflow y `render.yaml` deben agregarse y enviarse al repositorio GitHub
conectado a Render para que se ejecuten; este directorio local no tiene un
remoto Git configurado.
