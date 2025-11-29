import { Router } from "express";
import { crearVisitante } from "../controllers/visitante_controller.js";
import { 
  crearDonacionEconomica, 
  crearDonacionBienes,
  crearSesionPagoStripe 
} from "../controllers/donacion_controller.js";
import { 
  crearVisita,
  consultarDisponibilidad,
  sugerirHorariosDisponibles 
} from "../controllers/visita_controller.js";
import { uploadGeneral } from "../middleware/upload.js";
import {
  validarCamposRequeridos,
  validarCedula,
  validarNombre,
  validarMonto,
  validarEstadoBien,
  validarInstitucion,
  validarCantidadPersonas
} from "../middleware/validacion.js";

const router = Router();

// ==================== RUTAS PÚBLICAS PARA USUARIOS ====================

// ==================== VISITANTES INDIVIDUALES ====================

// Registrar visitante individual (por QR o formulario público)
router.post(
  "/visitante",
  validarCamposRequeridos(["nombre", "cedula", "institucion"]),
  validarNombre,
  validarCedula,
  crearVisitante
);

// ↓↓↓↓↓↓↓↓ VISITAS GRUPALES ↓↓↓↓↓↓↓↓

// Registrar visita grupal todo el mundo
router.post(
  "/visitas",
  validarCamposRequeridos(["institucion", "cantidadPersonas", "fechaVisita", "horaBloque"]),
  validarInstitucion,
  validarCantidadPersonas,
  crearVisita
);

// Consultar disponibilidad de visitas grupales
router.get(
  "/visitas/disponibilidad",
  consultarDisponibilidad
);

// Sugerir horarios disponibles para visitas grupales
router.get(
  "/visitas/sugerir-horarios",
  sugerirHorariosDisponibles
);

// ↓↓↓↓↓↓↓↓ DONACIONES ↓↓↓↓↓↓↓↓

// Crear donación económica
router.post(
  "/donacion/economica",
  validarCamposRequeridos(["nombreDonante", "institucion", "monto"]),
  validarNombre,
  validarMonto,
  crearDonacionEconomica
);

// Crear donación de bienes
router.post(
  "/donacion/bienes",
  uploadGeneral.single("fotoBien"),
  validarCamposRequeridos(["nombreDonante", "institucion", "descripcionBien", "estadoBien"]),
  validarNombre,
  validarEstadoBien,
  crearDonacionBienes
);

// Crear sesión de pago para donación económica
router.post(
  "/donacion/pago",
  validarCamposRequeridos(["donacionId"]),
  crearSesionPagoStripe
);

export default router;