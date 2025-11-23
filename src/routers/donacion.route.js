import { Router } from "express";
import express from "express";
import {
  crearDonacionEconomica,
  crearDonacionBienes,
  crearSesionPagoStripe,
  webhookStripe,
  verificarEstadoPago,
  actualizarEstadoDonacionBienes,
  obtenerDonaciones,
  obtenerDonacionPorId,
  obtenerEstadisticasDonaciones
} from "../controllers/donacion_controller.js";
import { verificarToken, autorizarRoles } from "../middleware/jwt.js";
import { uploadGeneral } from "../middleware/upload.js";
import {
  validarCamposRequeridos,
  validarNombre,
  validarMonto,
  validarTipoDonacion,
  validarEstadoBien
} from "../middleware/validacion.js";

const router = Router();

// ==================== WEBHOOK STRIPE ====================
// IMPORTANTE: Debe estar ANTES de express.json() en server.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookStripe
);

// ==================== RUTAS PÚBLICAS ====================

// Crear donación económica (Usuario público)
router.post(
  "/economica",
  validarCamposRequeridos(["nombreDonante", "institucion", "monto"]),
  validarNombre,
  validarMonto,
  crearDonacionEconomica
);

// Crear donación de bienes (Usuario público)
router.post(
  "/bienes",
  uploadGeneral.single("fotoBien"),
  validarCamposRequeridos(["nombreDonante", "institucion", "descripcionBien", "estadoBien"]),
  validarNombre,
  validarEstadoBien,
  crearDonacionBienes
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

// ==================== RUTAS PROTEGIDAS ====================

// Actualizar estado de donación de bienes (Admin/Admini)
router.patch(
  "/:id/estado-bien",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  validarCamposRequeridos(["status"]),
  actualizarEstadoDonacionBienes
);

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