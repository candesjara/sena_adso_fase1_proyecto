# Guía de la evidencia: Persistencia y CRUD

En esta evidencia vas a construir una API que guarda datos en una base de datos y relaciona dos tablas. Parte del ejemplo de **categorías y artículos** que está en esta carpeta y adáptalo al tema de tu proyecto.

Antes de empezar, ejecuta el ejemplo siguiendo el `README.md` (**opción A**: clonar el repositorio, `npm install`, `npm start`) y prueba sus rutas en Postman. Así sabrás cómo debe funcionar tu versión.

Para tu propio proyecto, empieza con una carpeta vacía y sigue la **opción B** del `README.md`:

```bash
npm init -y
npm install express
```

Luego crea tu `server.js` y, en `package.json`, cambia `"main"` a `"server.js"` y agrega el script `"start": "node server.js"`.

---

## 1. Qué vas a construir

1. Elige una **entidad principal** de tu proyecto, por ejemplo `libros`, `productos`, `pacientes` o `citas`.
2. Elige una **segunda entidad relacionada** con la principal, por ejemplo `generos`, `categorias`, `medicos` o `sedes`.
3. Implementa el **CRUD completo** de la entidad principal: crear, listar, actualizar y eliminar.
4. En la segunda entidad, implementa al menos **crear** y **listar**.
5. Crea una consulta que muestre **información de ambas tablas** a la vez, usando un `JOIN`.

> Regla para elegir: cada registro de la entidad principal debe pertenecer a **uno** de la segunda entidad. Ejemplo: cada libro tiene **un** género, y un género tiene **muchos** libros.

---

## 2. Cómo adaptar el ejemplo

Como muestra, usaremos **libros** (entidad principal) y **géneros** (entidad relacionada).

### Cómo se conectan las tablas

- La tabla `libros` tiene una columna `genero_id`.
- `genero_id` guarda el `id` del género al que pertenece el libro. Esa columna es la **clave foránea**.
- Si el libro "Cien años de soledad" tiene `genero_id = 1` y el género con `id = 1` es "Novela", ese libro es una novela.

```sql
CREATE TABLE IF NOT EXISTS generos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS libros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  autor TEXT,
  genero_id INTEGER NOT NULL,
  FOREIGN KEY (genero_id) REFERENCES generos(id)
);
```

### Cómo el listado muestra el nombre del género

El `JOIN` une cada libro con el género cuyo `id` coincide con su `genero_id`:

```sql
SELECT
  libros.id,
  libros.titulo,
  libros.autor,
  generos.id AS genero_id,
  generos.nombre AS genero_nombre
FROM libros
JOIN generos ON libros.genero_id = generos.id
ORDER BY libros.id;
```

Resultado en `GET /libros`:

```json
[
  { "id": 1, "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez", "genero_id": 1, "genero_nombre": "Novela" }
]
```

### Qué debes cambiar en `server.js`

| Qué cambiar | En el ejemplo | En la muestra de libros | En tu proyecto |
|-------------|---------------|-------------------------|----------------|
| Tabla relacionada | `categorias` | `generos` | La tuya |
| Tabla principal | `articulos` | `libros` | La tuya |
| Campos de la principal | `nombre`, `descripcion` | `titulo`, `autor` | Los de tu entidad |
| Clave foránea | `categoria_id` | `genero_id` | `<entidad>_id` |
| Rutas | `/categorias`, `/articulos`, `/articulos/:id` | `/generos`, `/libros`, `/libros/:id` | Las tuyas |
| `JOIN` | `articulos.categoria_id = categorias.id` | `libros.genero_id = generos.id` | El tuyo |
| Archivo de base de datos | `tienda.db` | `biblioteca.db` | Uno con el nombre de tu proyecto |

Consejos:

- Cambia los nombres en **todas** partes: el `CREATE TABLE`, los `INSERT`, `UPDATE`, `DELETE`, el `SELECT` con `JOIN`, las validaciones y los mensajes de error.
- Si agregas campos, súmalos también a los `?` de cada consulta y a la lista de valores de `.run(...)`.
- Conserva la línea `PRAGMA foreign_keys = ON;` y la validación que devuelve `400` cuando el `genero_id` no existe.
- Si cambias la estructura de una tabla, borra el archivo `.db` para que se vuelva a crear.

---

## 3. Qué debes entregar

1. **Código fuente**: `server.js` (y cualquier otro archivo que hayas creado).
2. **`package.json`**, con el script `npm start`.
3. **`README.md`**, con:
   - la versión de Node.js que usaste;
   - los pasos para instalar e iniciar (`npm install`, `npm start`);
   - las rutas, con su método, URL, cuerpo JSON de ejemplo y respuesta esperada.
4. **Evidencia de pruebas**: capturas de Postman, o un registro de las peticiones y respuestas, que muestren:
   - el **CRUD** de la entidad principal;
   - la **relación** entre las tablas (el listado con el nombre de la entidad relacionada);
   - la **persistencia** (los datos siguen después de reiniciar el servidor).

No entregues la carpeta `node_modules`. Quien revise tu trabajo la recupera con `npm install`.

---

## 4. Cómo demostrar que funciona

Sigue esta secuencia y toma una captura de cada paso (petición y respuesta). Aquí aparece con el ejemplo; repítela con las tablas de tu proyecto.

1. **Crea dos categorías.** `POST /categorias` con `{ "nombre": "Papelería" }` y luego con `{ "nombre": "Tecnología" }`.
2. **Consulta sus identificadores.** `GET /categorias`. Anota el `id` de cada una (por ejemplo, 1 y 2).
3. **Crea un artículo asociado a la primera.** `POST /articulos` con `{ "nombre": "Cuaderno", "descripcion": "100 hojas", "categoria_id": 1 }`.
4. **Verifica el nombre de la categoría en el listado.** `GET /articulos` debe mostrar `"categoria_nombre": "Papelería"`.
5. **Asocia el artículo a la segunda categoría.** `PUT /articulos/1` con `{ "nombre": "Cuaderno", "descripcion": "100 hojas", "categoria_id": 2 }`.
6. **Reinicia el servidor.** Detenlo con `Ctrl + C` y vuelve a ejecutar `npm start`.
7. **Comprueba que se conservó el cambio.** `GET /articulos` debe mostrar `"categoria_nombre": "Tecnología"`.
8. **Elimina el artículo.** `DELETE /articulos/1`.
9. **Verifica que desapareció.** `GET /articulos` ya no debe mostrarlo.

Prueba también un error: `POST /articulos` con `{ "nombre": "Mouse", "categoria_id": 99 }` debe responder **400**, porque esa categoría no existe.

---

## 5. Lista de verificación

Antes de entregar, confirma cada punto:

- [ ] La aplicación se instala y se inicia siguiendo **solo** los pasos de tu `README.md`.
- [ ] **Crear** funciona: `POST` responde `201` y devuelve el registro con su `id`.
- [ ] **Listar** funciona: `GET` devuelve los registros guardados.
- [ ] **Actualizar** funciona: `PUT` cambia los datos, incluida la entidad relacionada.
- [ ] **Eliminar** funciona: `DELETE` borra el registro y, si no existe, responde `404`.
- [ ] Las dos tablas se relacionan mediante una **clave foránea** (`..._id`).
- [ ] La API responde `400` si falta un campo obligatorio o si el `..._id` no existe.
- [ ] El listado de la entidad principal muestra datos de **ambas tablas** (usa `JOIN`).
- [ ] Los datos **siguen ahí después de reiniciar** el servidor.
- [ ] Incluiste el código, `package.json`, `README.md` y las capturas o el registro de pruebas.
