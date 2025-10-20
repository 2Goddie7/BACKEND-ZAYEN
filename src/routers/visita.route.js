import { Router } from "express";
import { crearVisitante } from "../controllers/visitante_controller.js";
import { crearDonacion, crearSesionPagoStripe } from "../controllers/donacion_controller.js";
import {
  validarCamposRequeridos,
  validarCedula,
  validarMonto
} from "../middleware/validacion.js";

const router = Router();

// ==================== RUTAS PÚBLICAS PARA USUARIOS ====================

// Registrar visita (por QR o formulario público)
router.post(
  "/visita",
  validarCamposRequeridos(["nombre", "cedula", "institucion"]),
  validarCedula,
  crearVisitante
);

// Crear registro de donación
router.post(
  "/donacion",
  validarCamposRequeridos(["nombreDonante", "institucion", "monto"]),
  validarMonto,
  crearDonacion
);

// Crear sesión de pago para donación
router.post(
  "/donacion/pago",
  validarCamposRequeridos(["donacionId"]),
  crearSesionPagoStripe
);

// Ruta de información pública (opcional)
router.get("/", (req, res) => {
  res.json({
    msg: "API Pública del Museo Gustavo Orcés",
    endpoints: {
      registrarVisita: "POST /api/publico/visita",
      crearDonacion: "POST /api/publico/donacion",
      pagarDonacion: "POST /api/publico/donacion/pago"
    }
  });
});

export default router;