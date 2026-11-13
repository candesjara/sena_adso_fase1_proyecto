# API de ejemplo: Persistencia y CRUD (categorías y artículos)

API REST hecha con **Node.js**, **Express** y **SQLite**. Guarda categorías y artículos en un archivo local (`tienda.db`). Cada artículo pertenece a una categoría.

Verificada con **Node.js v24.22.1** y **npm 11.19.1** en Windows 11.

## Requisitos

- Node.js **22.13 o superior** (recomendado: 24 LTS). Para revisar tu versión, ejecuta:

  ```bash
  node --version
  ```

- Postman, o cualquier otro cliente HTTP.

La aplicación usa el módulo `node:sqlite`, que ya viene incluido en Node.js. No necesitas instalar SQLite aparte. En Node 22 puede aparecer el aviso `ExperimentalWarning: SQLite is an experimental feature`; es normal y no afecta el funcionamiento.

## Estructura

```
├── server.js       # Conexión, creación de tablas y rutas
├── package.json    # Dependencias y script "npm start"
├── README.md
└── tienda.db       # Se crea solo al iniciar la API (aquí quedan los datos)
```

## Modelo de datos

| Tabla        | Campos                                                                                                    |
|--------------|-----------------------------------------------------------------------------------------------------------|
| `categorias` | `id` (automático), `nombre` (obligatorio)                                                                 |
| `articulos`  | `id` (automático), `nombre` (obligatorio), `descripcion` (opcional), `categoria_id` (obligatorio, clave foránea a `categorias.id`) |

Relación: **una categoría tiene muchos artículos**, y **cada artículo pertenece a una sola categoría**.

## Instalar e iniciar

```bash
npm install
npm start
```

Deberías ver:

```
Servidor escuchando en http://localhost:3000
```

Para detener el servidor, presiona `Ctrl + C` en la terminal.

## Probar en Postman

En todas las peticiones que llevan cuerpo, ve a **Body → raw → JSON** (Postman añade el encabezado `Content-Type: application/json`).

Haz las pruebas en este orden. Los `id` de ejemplo suponen que empiezas con una base de datos vacía; si ya tienes datos, usa los `id` que te devuelva la API.

### 1. Crear categorías — `POST /categorias`

URL: `http://localhost:3000/categorias`

```json
{ "nombre": "Papelería" }
```

Resultado esperado: **201 Created**

```json
{ "id": 1, "nombre": "Papelería" }
```

Repite la petición con `{ "nombre": "Tecnología" }` y obtendrás `id: 2`.

### 2. Listar categorías — `GET /categorias`

URL: `http://localhost:3000/categorias` (sin cuerpo)

Resultado esperado: **200 OK**

```json
[
  { "id": 1, "nombre": "Papelería" },
  { "id": 2, "nombre": "Tecnología" }
]
```

### 3. Crear un artículo — `POST /articulos`

URL: `http://localhost:3000/articulos`

```json
{ "nombre": "Cuaderno", "descripcion": "100 hojas", "categoria_id": 1 }
```

Resultado esperado: **201 Created**

```json
{ "id": 1, "nombre": "Cuaderno", "descripcion": "100 hojas", "categoria_id": 1 }
```

### 4. Listar artículos con su categoría — `GET /articulos`

URL: `http://localhost:3000/articulos` (sin cuerpo)

Resultado esperado: **200 OK**. Gracias al `JOIN`, cada artículo trae el nombre de su categoría:

```json
[
  {
    "id": 1,
    "nombre": "Cuaderno",
    "descripcion": "100 hojas",
    "categoria_id": 1,
    "categoria_nombre": "Papelería"
  }
]
```

### 5. Actualizar un artículo — `PUT /articulos/:id`

URL: `http://localhost:3000/articulos/1`

Envía el artículo completo; aquí se cambia de categoría:

```json
{ "nombre": "Cuaderno", "descripcion": "100 hojas", "categoria_id": 2 }
```

Resultado esperado: **200 OK**

```json
{ "id": 1, "nombre": "Cuaderno", "descripcion": "100 hojas", "categoria_id": 2 }
```

Si vuelves a hacer `GET /articulos`, verás `"categoria_nombre": "Tecnología"`.

### 6. Eliminar un artículo — `DELETE /articulos/:id`

URL: `http://localhost:3000/articulos/1` (sin cuerpo)

Resultado esperado: **200 OK**

```json
{ "mensaje": "Artículo 1 eliminado" }
```

### Errores que devuelve la API

| Caso | Petición de ejemplo | Respuesta |
|------|---------------------|-----------|
| Falta un campo obligatorio | `POST /articulos` con `{ "descripcion": "sin nombre", "categoria_id": 1 }` | **400** `{ "error": "Los campos \"nombre\" y \"categoria_id\" son obligatorios" }` |
| Categoría sin nombre | `POST /categorias` con `{}` | **400** `{ "error": "El campo \"nombre\" es obligatorio" }` |
| Categoría inexistente | `POST /articulos` con `{ "nombre": "Mouse", "categoria_id": 99 }` | **400** `{ "error": "La categoría con id 99 no existe" }` |
| Categoría inexistente al actualizar | `PUT /articulos/:id` de un artículo que exista, con `{ "nombre": "Cuaderno", "categoria_id": 99 }` | **400** `{ "error": "La categoría con id 99 no existe" }` |
| Artículo inexistente | `PUT` o `DELETE` a `/articulos/999` | **404** `{ "error": "El artículo con id 999 no existe" }` |

## Comprobar la persistencia

1. Crea categorías y artículos.
2. Detén el servidor con `Ctrl + C`.
3. Inícialo otra vez con `npm start`.
4. Haz `GET /articulos`: los datos siguen ahí porque están guardados en `tienda.db`.

Para empezar desde cero, detén el servidor y borra el archivo `tienda.db`. Se creará vacío al volver a iniciar.
