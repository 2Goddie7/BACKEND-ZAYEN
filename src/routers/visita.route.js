import { Router } from "express";
import {
  crearVisita,
  obtenerVisitas,
  obtenerVisitaPorId,
  actualizarEstadoVisita,
  eliminarVisita,
  consultarDisponibilidad,
  sugerirHorariosDisponibles,
  obtenerEstadisticasVisitas
} from "../controllers/visita_controller.js";
import { verificarToken, autorizarRoles } from "../middleware/jwt.js";
import {
  validarCamposRequeridos,
  validarNombre,
  validarInstitucion,
  validarCantidadPersonas
} from "../middleware/validacion.js";

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

// Consultar disponibilidad (público)
router.get(
  "/disponibilidad",
  consultarDisponibilidad
);

// Sugerir horarios disponibles (público)
router.get(
  "/sugerir-horarios",
  sugerirHorariosDisponibles
);

// ==================== RUTAS PROTEGIDAS ====================

// Crear visita (Admin, Admini, Pasante)
router.post(
  "/",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  validarCamposRequeridos(["institucion", "cantidadPersonas", "fechaVisita", "horaBloque"]),
  validarInstitucion,
  validarCantidadPersonas,
  crearVisita
);

// Obtener todas las visitas
router.get(
  "/",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerVisitas
);

// Obtener estadísticas
router.get(
  "/estadisticas",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerEstadisticasVisitas
);

// Obtener visita por ID
router.get(
  "/:id",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerVisitaPorId
);

// Actualizar estado de visita (realizada/cancelada)
router.patch(
  "/:id/estado",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  validarCamposRequeridos(["status"]),
  actualizarEstadoVisita
);

// Eliminar visita (solo Admin)
router.delete(
  "/:id",
  verificarToken,
  autorizarRoles("administrador"),
  eliminarVisita
);

export default router;