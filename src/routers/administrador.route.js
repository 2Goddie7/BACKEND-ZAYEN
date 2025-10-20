import { Router } from "express";
import {
  loginAdministrador,
  confirmarCuentaAdmini,
  obtenerPerfilAdministrador,
  actualizarPerfilAdministrador,
  actualizarFotoPerfilAdministrador,
  cambiarPasswordAdministrador,
  solicitarRecuperacionPassword,
  validarTokenRecuperacion,
  recuperarPassword,
  crearAdmin,
  listarAdminis,
  obtenerAdminiPorId,
  editarAdmini,
  eliminarAdministrador,
  crearPasante,
  confirmarPasante,
  obtenerPasantes,
  obtenerPasantePorId,
  actualizarPasante,
  eliminarPasante
} from "../controllers/administrador_controller.js";
import { verificarToken, autorizarRoles } from "../middleware/jwt.js";
import { uploadProfile } from "../middleware/upload.js";
import {
  validarCamposRequeridos,
  validarEmail,
  validarCelular,
  validarPassword,
  validarHorasPasantia
} from "../middleware/validacion.js";

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

// Autenticación
router.post(
  "/login",
  validarCamposRequeridos(["email", "password"]),
  validarEmail,
  loginAdministrador
);

// Confirmar cuenta
router.get("/confirmar/:token", confirmarCuentaAdmini);

// Recuperación de contraseña
router.post(
  "/recuperar-password",
  validarCamposRequeridos(["email"]),
  validarEmail,
  solicitarRecuperacionPassword
);

router.get("/recuperar-password/:token", validarTokenRecuperacion);

router.post(
  "/recuperar-password/:token",
  validarCamposRequeridos(["nuevaPassword"]),
  validarPassword,
  recuperarPassword
);

// ==================== RUTAS PROTEGIDAS ====================

// Perfil del administrador/admini actual
router.get(
  "/perfil",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  obtenerPerfilAdministrador
);

router.put(
  "/perfil",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  validarCelular,
  actualizarPerfilAdministrador
);

router.put(
  "/perfil/:id/foto",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  uploadProfile.single("fotoPerfil"),
  actualizarFotoPerfilAdministrador
);

// Cambiar contraseña
router.put(
  "/cambiar-password",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  validarCamposRequeridos(["actualPassword", "nuevaPassword"]),
  validarPassword,
  cambiarPasswordAdministrador
);

// ==================== CRUD ADMINIS (Solo Administrador) ====================

router.post(
  "/adminis",
  verificarToken,
  autorizarRoles("administrador"),
  validarCamposRequeridos(["nombre", "email", "password", "celular", "tipo"]),
  validarEmail,
  validarCelular,
  validarPassword,
  crearAdmin
);

router.get(
  "/adminis",
  verificarToken,
  autorizarRoles("administrador"),
  listarAdminis
);

router.get(
  "/adminis/:id",
  verificarToken,
  autorizarRoles("administrador"),
  obtenerAdminiPorId
);

router.put(
  "/adminis/:id",
  verificarToken,
  autorizarRoles("administrador"),
  validarCelular,
  validarHorasPasantia,
  editarAdmini
);

router.delete(
  "/adminis/:id",
  verificarToken,
  autorizarRoles("administrador"),
  eliminarAdministrador
);

// ==================== CRUD PASANTES ====================

router.post(
  "/pasantes",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  validarCamposRequeridos(["nombre", "email", "facultad", "celular"]),
  validarEmail,
  validarCelular,
  validarHorasPasantia,
  crearPasante
);

router.get(
  "/pasantes/confirmar/:token",
  confirmarPasante
);

router.get(
  "/pasantes",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  obtenerPasantes
);

router.get(
  "/pasantes/:id",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  obtenerPasantePorId
);

router.put(
  "/pasantes/:id",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  validarCelular,
  validarHorasPasantia,
  actualizarPasante
);

router.delete(
  "/pasantes/:id",
  verificarToken,
  autorizarRoles("administrador", "admini"),
  eliminarPasante
);

export default router;