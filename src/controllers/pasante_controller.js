import Pasante from "../models/Pasante.js";
import { generarToken } from "../middleware/jwt.js";

// ==================== AUTENTICACIÓN ====================

// Login con Google (manejado en auth_routes.js, pero aquí una función auxiliar si necesitas)
const loginPasanteGoogle = async (req, res) => {
  try {
    // Esta función es llamada después del callback de Google
    const pasante = req.user;

    if (!pasante) {
      return res.status(403).json({ msg: "Correo no autorizado" });
    }

    const token = generarToken(pasante._id, "pasante");

    res.status(200).json({
      msg: "Login con Google exitoso",
      token,
      pasante: {
        id: pasante._id,
        nombre: pasante.nombre,
        email: pasante.email,
        facultad: pasante.facultad,
        horasDePasantia: pasante.horasDePasantia,
        celular: pasante.celular,
        fotoPerfil: pasante.fotoPerfil
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error en login con Google", error: error.message });
  }
};

// ==================== PERFIL ====================

// Obtener perfil del pasante actual
const obtenerPerfilPasante = async (req, res) => {
  try {
    const pasante = req.user;

    if (!pasante) {
      return res.status(404).json({ msg: "Pasante no encontrado" });
    }

    res.status(200).json({
      id: pasante._id,
      nombre: pasante.nombre,
      email: pasante.email,
      facultad: pasante.facultad,
      horasDePasantia: pasante.horasDePasantia,
      celular: pasante.celular,
      fotoPerfil: pasante.fotoPerfil
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener perfil", error: error.message });
  }
};

// Actualizar perfil del pasante (solo celular y foto)
const actualizarPerfilPasante = async (req, res) => {
  try {
    const pasante = req.user;
    const { celular } = req.body;

    if (celular) {
      pasante.celular = celular;
      await pasante.save();
    }

    res.status(200).json({
      msg: "Perfil actualizado correctamente",
      pasante: {
        id: pasante._id,
        nombre: pasante.nombre,
        email: pasante.email,
        celular: pasante.celular,
        fotoPerfil: pasante.fotoPerfil
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar perfil", error: error.message });
  }
};

// Actualizar foto de perfil del pasante
const actualizarFotoPerfilPasante = async (req, res) => {
  try {
    const pasante = req.user;

    if (!req.file) {
      return res.status(400).json({ msg: "No se subió ninguna imagen" });
    }

    pasante.fotoPerfil = req.file.path;
    await pasante.save();

    res.status(200).json({
      msg: "Foto de perfil actualizada correctamente",
      fotoPerfil: pasante.fotoPerfil
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar foto", error: error.message });
  }
};

export {
  loginPasanteGoogle,
  obtenerPerfilPasante,
  actualizarPerfilPasante,
  actualizarFotoPerfilPasante
};