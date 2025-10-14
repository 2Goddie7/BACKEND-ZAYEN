import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Configuración
app.set("port", process.env.PORT || 3000);
app.use(cors());
app.use(express.json());

// Ruta base (para comprobar que el server funciona)
app.get("/", (req, res) => {
  res.send("🚀 Servidor del Museo Gustavo Orcés funcionando correctamente");
});

// Aquí irán las rutas (cuando las agreguemos)
// app.use("/api/admin", adminRoutes);
// app.use("/api/pasantes", pasanteRoutes);
// app.use("/api/exposiciones", exposicionRoutes);
// app.use("/api/donaciones", donacionesRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ msg: "❌ Endpoint no encontrado" });
});

export default app;
