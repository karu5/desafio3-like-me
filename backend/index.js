const { pool } = require("./connection.js"); // Importamos pool desde connection
const cors = require("cors");
const express = require("express");

const app = express(); // Creamos una instancia de express

// Middlewares
app.use(express.json()); // Middleware para parsear el body de las peticiones
app.use(cors()); // Middleware para permitir peticiones desde cualquier origen

// Función para acortar URLs
async function shortenURL(longURL) {
    try {
        const { default: fetch } = await import("node-fetch");
        const response = await fetch(`http://tinyurl.com/api-create.php?url=${encodeURIComponent(longURL)}`);
        if (response.ok) {
            return await response.text(); // Retorna la URL acortada
        } else {
            throw new Error("Error al acortar la URL");
        }
    } catch (error) {
        console.error("Error:", error.message);
        return longURL; // Si hay un error, usa la URL original
    }
}

// Ruta para obtener todos los posts
app.get("/posts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM posts"); // Ejecutamos la consulta
    res.status(200).json(result.rows); // Respondemos con los registros obtenidos
  } catch (error) {
    console.error("Error al obtener los posts:", error.message);
    res.status(500).json({ message: "Error al obtener los posts", error: error.message });
  }
});

// Ruta para crear un nuevo post
app.post("/posts", async (req, res) => {
  try {
    const { titulo, img, descripcion } = req.body;

    if (!titulo || !img || !descripcion) {
      return res.status(400).json({ message: "Todos los campos son obligatorios: titulo, img, descripcion" });
    }

    // Acortar la URL de la imagen
    const shortImg = await shortenURL(img);

    // Insertar datos en la base de datos
    const result = await pool.query({
      text: "INSERT INTO posts (titulo, img, descripcion, likes) VALUES ($1, $2, $3, $4) RETURNING *",
      values: [titulo, shortImg, descripcion, 0],  // 'likes' es 0 por defecto
    });

    res.status(201).json({
      message: "Se insertó el post correctamente",
      result: result.rows[0], // Retornamos solo el registro insertado
    });
  } catch (error) {
    console.error("Error en la ruta POST /posts:", error.message);
    res.status(500).json({ message: "Error al insertar el post", error: error.message });
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`El servidor está corriendo en http://localhost:${PORT}`);
});