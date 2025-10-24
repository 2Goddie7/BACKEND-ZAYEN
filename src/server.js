import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "./config/passport-google.js";

// Importar rutas
import administradorRoutes from "./routers/administrador.route.js";
import pasanteRoutes from "./routers/pasante.route.js";
import authRoutes from "./routers/auth_routes.js";
import visitanteRoutes from "./routers/visitante.route.js";
import visitaRoutes from "./routers/visita.route.js";
import donacionRoutes from "./routers/donacion.route.js";
import usuarioPublicoRoutes from "./routers/usuario.route.js";

dotenv.config();

const app = express();

// ==================== CONFIGURACIÓN ====================
app.set("port", process.env.PORT || 3000);

// ==================== MIDDLEWARES ====================

// CORS
app.use(cors({
  origin: process.env.URL_FRONTEND || "http://localhost:5173",
  credentials: true
}));

// IMPORTANTE: Webhook de Stripe debe estar ANTES de express.json()
// (se maneja en donacion.route.js con express.raw())

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar Passport
app.use(passport.initialize());

// ==================== RUTA BASE ====================
app.get("/", (req, res) => {
  res.json({
    msg: "🏛️ API del Museo Gustavo Orcés",
    version: "1.0.0",
    status: "online",
    endpoints: {
      auth: "/api/auth",
      administrador: "/api/admin",
      pasante: "/api/pasante",
      visitantes: "/api/visitantes",
      visitas: "/api/visitas",
      donaciones: "/api/donaciones",
      publico: "/api/publico"
    }
  });
});

// ==================== RUTAS ====================

// Autenticación (Google OAuth)
app.use("/api/auth", authRoutes);

// Administradores y Adminis
app.use("/api/admin", administradorRoutes);

// Pasantes
app.use("/api/pasante", pasanteRoutes);

// Visitantes
app.use("/api/visitantes", visitanteRoutes);

// Visitas
app.use("/api/visitas", visitaRoutes);

// Donaciones
app.use("/api/donaciones", donacionRoutes);

// Usuario Público
app.use("/api/publico", usuarioPublicoRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    msg: "Error 404, Endpoint no encontrado! :(",
    path: req.path,
    method: req.method
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  
  res.status(err.status || 500).json({
    msg: err.message || "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

export default app;