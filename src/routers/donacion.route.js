import { Router } from "express";
import express from "express";
import {
  crearDonacion,
  crearSesionPagoStripe,
  webhookStripe,
  verificarEstadoPago,
  obtenerDonaciones,
  obtenerDonacionPorId,
  obtenerEstadisticasDonaciones
} from "../controllers/donacion_controller.js";
import { verificarToken, autorizarRoles } from "../middleware/jwt.js";
import {
  validarCamposRequeridos,
  validarMonto
} from "../middleware/validacion.js";

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

// Crear donación (Usuario público)
router.post(
  "/publico",
  validarCamposRequeridos(["nombreDonante", "institucion", "monto"]),
  validarMonto,
  crearDonacion
);

// Crear sesión de pago Stripe (Usuario público)
router.post(
  "/pago",
  validarCamposRequeridos(["donacionId"]),
  crearSesionPagoStripe
);

// Verificar estado de pago
router.get(
  "/pago/:sessionId",
  verificarEstadoPago
);

// Webhook de Stripe (IMPORTANTE: debe estar antes de express.json())
// Esta ruta recibe raw body de Stripe
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookStripe
);

// ==================== RUTAS PROTEGIDAS (Solo Lectura) ====================

// Obtener todas las donaciones
router.get(
  "/",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerDonaciones
);

// Obtener estadísticas
router.get(
  "/estadisticas",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerEstadisticasDonaciones
);

// Obtener donación por ID
router.get(
  "/:id",
  verificarToken,
  autorizarRoles("administrador", "admini", "pasante"),
  obtenerDonacionPorId
);

export default router;