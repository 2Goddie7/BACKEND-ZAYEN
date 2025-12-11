import { Router } from "express";
import {
  obtenerPerfilPasante,
  actualizarPerfilPasante,
  actualizarFotoPerfilPasante
} from "../controllers/pasante_controller.js";
import { verificarToken, autorizarRoles } from "../middleware/jwt.js";
import { uploadProfile } from "../middleware/upload.js";
import { validarCelular } from "../middleware/validacion.js";

const router = Router();

// Perfil del pasante
router.get(
  "/perfil",
  verificarToken,
  autorizarRoles("pasante"),
  obtenerPerfilPasante
);

router.put(
  "/perfil",
  verificarToken,
  autorizarRoles("pasante"),
  validarCelular,
  actualizarPerfilPasante
);

router.put(
  "/perfil/foto",
  verificarToken,
  autorizarRoles("pasante"),
  uploadProfile.single("fotoPerfil"),
  actualizarFotoPerfilPasante
);

export default router;