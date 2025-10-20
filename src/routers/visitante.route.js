import { Router } from "express";
import {
  crearVisitante,
  obtenerVisitantes,
  obtenerVisitantePorId,
  eliminarVisitante,
  obtenerEstadisticasVisitantes
} from "../controllers/visitante_controller.js";
import { verificarToken, autorizarRoles } from "../middleware/jwt.js";
import {
  validarCamposRequeridos,
  validarCedula
} from "../middleware/validacion.js";

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

// Crear visitante (Usuario público via QR)
router.post(
  "/publico",
  validarCamposRequeridos(["nombre", "cedula", "institucion"]),
  validarCedula,
  crearVisitante
);

// ==================== RUTAS PROTEGIDAS ====================

// Crear visitante (Admin, Admini, Pasante)
router.post(
  "/",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  validarCamposRequeridos(["nombre", "cedula", "institucion"]),
  validarCedula,
  crearVisitante
);

// Obtener todos los visitantes
router.get(
  "/",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerVisitantes
);

// Obtener estadísticas
router.get(
  "/estadisticas",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerEstadisticasVisitantes
);

// Obtener visitante por ID
router.get(
  "/:id",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerVisitantePorId
);

// Eliminar visitante
router.delete(
  "/:id",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  eliminarVisitante
);

export default router;