import { Router } from "express";
import { crearVisitante } from "../controllers/visitante_controller.js";
import { 
  crearDonacionEconomica, 
  crearDonacionBienes,
  crearSesionPagoStripe 
} from "../controllers/donacion_controller.js";
import { 
  consultarDisponibilidad,
  sugerirHorariosDisponibles 
} from "../controllers/visita_controller.js";
import { uploadGeneral } from "../middleware/upload.js";
import {
  validarCamposRequeridos,
  validarCedula,
  validarNombre,
  validarMonto,
  validarEstadoBien
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

// ==================== VISITAS GRUPALES ====================

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

// ==================== DONACIONES ====================

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

// ==================== INFORMACIÓN ====================

// Ruta de información pública
router.get("/", (req, res) => {
  res.json({
    msg: "🏛️ API Pública del Museo Gustavo Orcés",
    version: "2.0.0",
    endpoints: {
      visitantes: {
        registrar: "POST /api/publico/visitante"
      },
      visitasGrupales: {
        consultarDisponibilidad: "GET /api/publico/visitas/disponibilidad?fecha=YYYY-MM-DD",
        sugerirHorarios: "GET /api/publico/visitas/sugerir-horarios?fecha=YYYY-MM-DD&personas=15"
      },
      donaciones: {
        crearEconomica: "POST /api/publico/donacion/economica",
        crearBienes: "POST /api/publico/donacion/bienes",
        pagar: "POST /api/publico/donacion/pago"
      }
    },
    informacion: {
      horarioAtencion: "Lunes a Viernes, 08:00 - 16:30",
      visitasIndividuales: "Sin restricción de horario",
      visitasGrupales: "Bloques de 30 minutos, máximo 25 personas por bloque",
      tiposDonacion: ["economica", "bienes"]
    }
  });
});

export default router;