// API REST de ejemplo: categorías y artículos guardados en SQLite.
// Usa el módulo "node:sqlite" que ya viene incluido en Node.js (22.13 o superior).

const express = require('express');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PUERTO = 3000;

// Permite leer el cuerpo de las peticiones en formato JSON.
app.use(express.json());

// ---------------------------------------------------------------
// 1. Conexión a la base de datos
// ---------------------------------------------------------------
// Los datos se guardan en el archivo "tienda.db", en esta misma carpeta.
// Si el archivo no existe, SQLite lo crea automáticamente.
const db = new DatabaseSync('tienda.db');

// Activa la verificación de claves foráneas.
// Así SQLite no permite guardar un artículo con una categoría que no existe.
db.exec('PRAGMA foreign_keys = ON;');

// ---------------------------------------------------------------
// 2. Creación de las tablas (solo si todavía no existen)
// ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
  );
`);

// LA RELACIÓN SE GUARDA AQUÍ: cada artículo tiene la columna "categoria_id",
// que guarda el id de la categoría a la que pertenece (clave foránea).
// Una categoría puede tener muchos artículos; un artículo, una sola categoría.
db.exec(`
  CREATE TABLE IF NOT EXISTS articulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  );
`);

// Función de ayuda: devuelve true si existe una categoría con ese id.
function existeCategoria(id) {
  const fila = db.prepare('SELECT id FROM categorias WHERE id = ?').get(id);
  return fila !== undefined;
}

// ---------------------------------------------------------------
// 3. Rutas de categorías
// ---------------------------------------------------------------

// Crear una categoría
app.post('/categorias', function (req, res) {
  const datos = req.body || {};
  const nombre = datos.nombre;

  if (!nombre) {
    return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
  }

  // Los signos "?" son parámetros: SQLite los reemplaza de forma segura.
  const resultado = db
    .prepare('INSERT INTO categorias (nombre) VALUES (?)')
    .run(nombre);

  res.status(201).json({ id: Number(resultado.lastInsertRowid), nombre: nombre });
});

// Listar las categorías
app.get('/categorias', function (req, res) {
  const categorias = db.prepare('SELECT id, nombre FROM categorias ORDER BY id').all();
  res.json(categorias);
});

// ---------------------------------------------------------------
// 4. Rutas de artículos
// ---------------------------------------------------------------

// Crear un artículo asociado a una categoría existente
app.post('/articulos', function (req, res) {
  const datos = req.body || {};
  const nombre = datos.nombre;
  const descripcion = datos.descripcion || null;
  const categoriaId = datos.categoria_id;

  if (!nombre || !categoriaId) {
    return res
      .status(400)
      .json({ error: 'Los campos "nombre" y "categoria_id" son obligatorios' });
  }

  if (!existeCategoria(categoriaId)) {
    return res
      .status(400)
      .json({ error: 'La categoría con id ' + categoriaId + ' no existe' });
  }

  const resultado = db
    .prepare('INSERT INTO articulos (nombre, descripcion, categoria_id) VALUES (?, ?, ?)')
    .run(nombre, descripcion, categoriaId);

  res.status(201).json({
    id: Number(resultado.lastInsertRowid),
    nombre: nombre,
    descripcion: descripcion,
    categoria_id: categoriaId
  });
});

// Listar los artículos con los datos de su categoría.
// LA RELACIÓN SE CONSULTA AQUÍ: el JOIN une cada artículo con la categoría
// cuyo id es igual a su categoria_id, y así obtenemos el nombre de la categoría.
app.get('/articulos', function (req, res) {
  const articulos = db
    .prepare(`
      SELECT
        articulos.id,
        articulos.nombre,
        articulos.descripcion,
        categorias.id AS categoria_id,
        categorias.nombre AS categoria_nombre
      FROM articulos
      JOIN categorias ON articulos.categoria_id = categorias.id
      ORDER BY articulos.id
    `)
    .all();

  res.json(articulos);
});

// Actualizar un artículo (incluida su categoría)
app.put('/articulos/:id', function (req, res) {
  const id = req.params.id;
  const datos = req.body || {};
  const nombre = datos.nombre;
  const descripcion = datos.descripcion || null;
  const categoriaId = datos.categoria_id;

  if (!nombre || !categoriaId) {
    return res
      .status(400)
      .json({ error: 'Los campos "nombre" y "categoria_id" son obligatorios' });
  }

  const articulo = db.prepare('SELECT id FROM articulos WHERE id = ?').get(id);
  if (articulo === undefined) {
    return res.status(404).json({ error: 'El artículo con id ' + id + ' no existe' });
  }

  if (!existeCategoria(categoriaId)) {
    return res
      .status(400)
      .json({ error: 'La categoría con id ' + categoriaId + ' no existe' });
  }

  db.prepare('UPDATE articulos SET nombre = ?, descripcion = ?, categoria_id = ? WHERE id = ?')
    .run(nombre, descripcion, categoriaId, id);

  res.json({
    id: Number(id),
    nombre: nombre,
    descripcion: descripcion,
    categoria_id: categoriaId
  });
});

// Eliminar un artículo
app.delete('/articulos/:id', function (req, res) {
  const id = req.params.id;
  const resultado = db.prepare('DELETE FROM articulos WHERE id = ?').run(id);

  // "changes" indica cuántas filas se borraron. Si es 0, el artículo no existía.
  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'El artículo con id ' + id + ' no existe' });
  }

  res.json({ mensaje: 'Artículo ' + id + ' eliminado' });
});

// ---------------------------------------------------------------
// 5. Iniciar el servidor
// ---------------------------------------------------------------
app.listen(PUERTO, function () {
  console.log('Servidor escuchando en http://localhost:' + PUERTO);
});
