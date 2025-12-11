import jwt from "jsonwebtoken";
import Administrador from "../models/Administrador.js";
import Pasante from "../models/Pasante.js";

export const generarToken = (id, rol) => {
  return jwt.sign(
    { id, rol },
    process.env.JWT_SECRET || "secreto",
    { expiresIn: "1d" }
  );
};

// Verificar token y cargar usuario completo desde la base de datos
export const verificarToken = async (req, res, next) => {
  const { authorization } = req.headers;
  
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No se proporcionó un token válido" });
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto");

    // Cargar el usuario completo por su rol
    let usuario;
    if (decoded.rol === "administrador" || decoded.rol === "admini") {
      usuario = await Administrador.findById(decoded.id).select("-password");
    } else if (decoded.rol === "pasante") {
      usuario = await Pasante.findById(decoded.id).select("-password");
    }

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!usuario.status) {
      return res.status(403).json({ msg: "Usuario inactivo" });
    }

    // Guardar usuario completo 
    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Token inválido" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expirado" });
    }
    return res.status(500).json({ msg: "Error al verificar token", error: error.message });
  }
};

// Middleware de autorización por rol
export const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ msg: "No tienes permisos para acceder a este recurso" });
    }
    next();
  };
};

// Middleware específico: solo admini tipo estudiante tiene restricciones
export const verificarPermisoEdicionPasante = (req, res, next) => {
  const { facultad, horasDePasantia } = req.body;
  
  // Si el usuario es admini de tipo estudiante
  if (req.user.rol === "admini" && req.user.tipo === "estudiante") {
    // No puede editar facultad ni horasDePasantia
    if (facultad !== undefined || horasDePasantia !== undefined) {
      return res.status(403).json({ 
        msg: "Como admini de tipo estudiante, no puedes editar la facultad ni las horas de pasantía" 
      });
    }
  }
  
  next();
};