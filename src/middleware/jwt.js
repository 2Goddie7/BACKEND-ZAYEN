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

// Verificar token general
export const verificarToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ msg: "No se proporcionó un token" });
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto");

    req.user = { id: decoded.id, rol: decoded.rol };
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

// Middleware de autorización por rol
export const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ msg: "No tienes permisos para acceder" });
    }
    next();
  };
};
