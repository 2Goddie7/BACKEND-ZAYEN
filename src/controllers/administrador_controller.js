import Administrador from "../models/Administrador.js";
import Pasante from "../models/Pasante.js";
import { sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import { generarToken } from "../middleware/jwt.js";
import crypto from "crypto";

// ==================== AUTENTICACION ====================

// Login administrador
const loginAdministrador = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const admin = await Administrador.findOne({ email });
    if (!admin) {
      return res.status(404).json({ msg: "El correo no está registrado" });
    }

    if (!admin.confirmEmail) {
      return res.status(403).json({ 
        msg: "Debes confirmar tu cuenta por correo antes de iniciar sesión" 
      });
    }

    if (!admin.status) {
      return res.status(403).json({ msg: "Tu cuenta está inactiva" });
    }

    const rolesPermitidos = ["administrador", "admini"];
    if (!rolesPermitidos.includes(admin.rol)) {
      return res.status(403).json({ msg: "No tienes permisos de administrador" });
    }

    const passwordValida = await admin.matchPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ msg: "¡Credenciales incorrectas!" });
    }

    const token = generarToken(admin._id, admin.rol);

    const respuesta = {
      msg: "Inicio de sesión exitoso",
      token,
      admin: {
        id: admin._id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
        celular: admin.celular,
        fotoPerfil: admin.fotoPerfil
      }
    };

    // Si es admini, agregar campos adicionales
    if (admin.rol === "admini") {
      respuesta.admin.tipo = admin.tipo;
      if (admin.tipo === "estudiante") {
        respuesta.admin.facultad = admin.facultad;
        respuesta.admin.horasDePasantia = admin.horasDePasantia;
      }
    }

    res.status(200).json(respuesta);
  } catch (error) {
    res.status(500).json({ msg: "Error al iniciar sesión", error: error.message });
  }
};

// Confirmar cuenta admini
const confirmarCuentaAdmini = async (req, res) => {
  const { token } = req.params;

  try {
    const admin = await Administrador.findOne({ token });

    if (!admin) {
      return res.status(400).json({ msg: "Token inválido o cuenta ya confirmada" });
    }

    admin.confirmEmail = true;
    admin.token = null;
    await admin.save();

    res.status(200).json({ msg: "Cuenta confirmada correctamente. Ya puedes iniciar sesión" });
  } catch (error) {
    res.status(500).json({ msg: "Error al confirmar la cuenta", error: error.message });
  }
};

// ==================== PERFIL ====================

// Obtener perfil del administrador actual
const obtenerPerfilAdministrador = async (req, res) => {
  try {
    const admin = req.user;

    if (!admin) {
      return res.status(404).json({ msg: "Administrador no encontrado" });
    }

    const perfil = {
      id: admin._id,
      nombre: admin.nombre,
      email: admin.email,
      rol: admin.rol,
      celular: admin.celular,
      fotoPerfil: admin.fotoPerfil
    };

    // Si es admini de tipo estudiante agregar campos adicionales
    if (admin.rol === "admini") {
      perfil.tipo = admin.tipo;
      if (admin.tipo === "estudiante") {
        perfil.facultad = admin.facultad;
        perfil.horasDePasantia = admin.horasDePasantia;
      }
    }

    res.status(200).json(perfil);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener perfil", error: error.message });
  }
};

// Actualizar perfil (celular y foto)
const actualizarPerfilAdministrador = async (req, res) => {
  try {
    const admin = req.user;
    const { celular } = req.body;

    if (celular) {
      admin.celular = celular;
    }

    await admin.save();

    res.status(200).json({ 
      msg: "Perfil actualizado correctamente",
      admin: {
        id: admin._id,
        nombre: admin.nombre,
        email: admin.email,
        celular: admin.celular,
        fotoPerfil: admin.fotoPerfil
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar perfil", error: error.message });
  }
};

// Actualizar foto de perfil
const actualizarFotoPerfilAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Administrador.findById(id);
    
    if (!admin) {
      return res.status(404).json({ msg: "Administrador no encontrado" });
    }

    // Verificar que solo puede editar su propia foto o que sea administrador principal
    if (req.user._id.toString() !== id && req.user.rol !== 'administrador') {
      return res.status(403).json({ msg: "No tienes permiso para actualizar esta foto" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No se subió ninguna imagen :/" });
    }

    admin.fotoPerfil = req.file.path;
    await admin.save();

    res.status(200).json({ 
      msg: "Foto de perfil actualizada correctamente", 
      fotoPerfil: admin.fotoPerfil 
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar foto", error: error.message });
  }
};

// ==================== CONTRASEÑAS ====================

// Cambiar contraseña (estando autenticado)
const cambiarPasswordAdministrador = async (req, res) => {
  try {
    const { actualPassword, nuevaPassword } = req.body;

    if (!actualPassword || !nuevaPassword) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ msg: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const admin = await Administrador.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({ msg: "Administrador no encontrado" });
    }

    const passwordValida = await admin.matchPassword(actualPassword);
    if (!passwordValida) {
      return res.status(401).json({ msg: "La contraseña actual es incorrecta" });
    }

    admin.password = await admin.encrypPassword(nuevaPassword);
    await admin.save();

    res.status(200).json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al cambiar la contraseña", error: error.message });
  }
};


// Solicitar recuperación de contraseña
const solicitarRecuperacionPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ msg: "El email es requerido" });
    }

    const admin = await Administrador.findOne({ email });
    if (!admin) {
      return res.status(404).json({ msg: "Correo no encontrado" });
    }

    const token = crypto.randomUUID();
    admin.token = token;
    await admin.save();

    await sendMailToRecoveryPassword(admin.email, token);

    res.status(200).json({ msg: "Se ha enviado un correo para recuperar tu contraseña" });
  } catch (error) {
    res.status(500).json({ msg: "Error al solicitar recuperación", error: error.message });
  }
};

// Validar token de recuperación
const validarTokenRecuperacion = async (req, res) => {
  const { token } = req.params;
  
  try {
    const admin = await Administrador.findOne({ token });
    
    if (!admin) {
      return res.status(404).json({ msg: "Token inválido o expirado" });
    }
    
    res.status(200).json({ msg: "Token válido" });
  } catch (error) {
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
};

// Recuperar contraseña (con token)
const recuperarPassword = async (req, res) => {
  const { token } = req.params;
  const { nuevaPassword } = req.body;

  try {
    if (!nuevaPassword) {
      return res.status(400).json({ msg: "La nueva contraseña es requerida" });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres" });
    }

    const admin = await Administrador.findOne({ token });
    if (!admin) {
      return res.status(404).json({ msg: "Token no válido o expirado" });
    }

    admin.password = await admin.encrypPassword(nuevaPassword);
    admin.token = null;
    await admin.save();

    res.status(200).json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al restablecer contraseña", error: error.message });
  }
};

// ==================== CRUD ADMINIS ====================

// Crear admini (solo administrador principal)
const crearAdmin = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    const { nombre, email, password, celular, tipo, facultad, horasDePasantia } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !celular || !tipo) {
      return res.status(400).json({ msg: "Todos los campos obligatorios deben ser completados" });
    }

    // Si es tipo estudiante validar campos adicionales
    if (tipo === "estudiante") {
      if (!facultad || horasDePasantia === undefined) {
        return res.status(400).json({ 
          msg: "Para adminis de tipo estudiante, los campos facultad y horasDePasantia son obligatorios!" 
        });
      }
    }

    // Verificar si el email ya existe
    const emailExiste = await Administrador.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({ msg: "El correo ya se encuentra registrado" });
    }

    // Crear nuevo admini
    const nuevoAdmin = new Administrador({
      nombre,
      email,
      password: await Administrador.prototype.encrypPassword(password),
      celular,
      tipo,
      rol: "admini"
    });

    // Agregar campos condicionales
    if (tipo === "estudiante") {
      nuevoAdmin.facultad = facultad;
      nuevoAdmin.horasDePasantia = horasDePasantia || 0;
    }

    nuevoAdmin.token = nuevoAdmin.crearToken();
    await nuevoAdmin.save();

    sendMailToRegister(nuevoAdmin.email, nuevoAdmin.token);

    const respuesta = {
      msg: "Admini creado exitosamente. Se ha enviado un correo de confirmación",
      admin: {
        id: nuevoAdmin._id,
        nombre: nuevoAdmin.nombre,
        email: nuevoAdmin.email,
        rol: nuevoAdmin.rol,
        tipo: nuevoAdmin.tipo,
        celular: nuevoAdmin.celular
      }
    };

    if (tipo === "estudiante") {
      respuesta.admin.facultad = nuevoAdmin.facultad;
      respuesta.admin.horasDePasantia = nuevoAdmin.horasDePasantia;
    }

    res.status(201).json(respuesta);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear admini", error: error.message });
  }
};

// Listar todos los adminis
const listarAdminis = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ msg: "No tienes permiso para ver esta información" });
    }

    const adminis = await Administrador.find({ rol: "admini" })
      .select("nombre email tipo facultad horasDePasantia celular fotoPerfil status createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json(adminis);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los adminis", error: error.message });
  }
};

// Obtener admini por ID
const obtenerAdminiPorId = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ msg: "No tienes permiso para ver esta información" });
    }

    const { id } = req.params;
    const admini = await Administrador.findById(id).select("-password -token");

    if (!admini) {
      return res.status(404).json({ msg: "Admini no encontrado" });
    }

    if (admini.rol !== "admini") {
      return res.status(400).json({ msg: "Este usuario no es un admini" });
    }

    res.status(200).json(admini);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener admini", error: error.message });
  }
};

// Editar admini
const editarAdmini = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    const { id } = req.params;
    const { celular, facultad, horasDePasantia } = req.body;

    const admini = await Administrador.findById(id);
    if (!admini) {
      return res.status(404).json({ msg: "Admini no encontrado" });
    }

    if (admini.rol !== "admini") {
      return res.status(400).json({ msg: "Solo puedes editar cuentas de tipo admini" });
    }

    // Actualizar celular si se proporciona
    if (celular) {
      admini.celular = celular;
    }

    // Solo actualizar facultad y horas si es tipo estudiante
    if (admini.tipo === "estudiante") {
      if (facultad !== undefined) {
        admini.facultad = facultad;
      }
      if (horasDePasantia !== undefined) {
        admini.horasDePasantia = horasDePasantia;
      }
    }

    await admini.save();

    res.status(200).json({ 
      msg: "Admini actualizado correctamente",
      admini: {
        id: admini._id,
        nombre: admini.nombre,
        email: admini.email,
        tipo: admini.tipo,
        celular: admini.celular,
        facultad: admini.facultad,
        horasDePasantia: admini.horasDePasantia
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al editar admini", error: error.message });
  }
};

// Eliminar admini
const eliminarAdministrador = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ msg: "No tienes permiso para esta acción" });
    }

    const { id } = req.params;

    const adminAEliminar = await Administrador.findById(id);
    if (!adminAEliminar) {
      return res.status(404).json({ msg: "Administrador no encontrado" });
    }

    if (adminAEliminar.rol !== "admini") {
      return res.status(400).json({ msg: "Solo puedes eliminar cuentas de tipo admini" });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ msg: "No puedes eliminarte a ti mismo" });
    }

    await adminAEliminar.deleteOne();
    res.status(200).json({ msg: "Admini eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar admini", error: error.message });
  }
};

// ==================== CRUD PASANTES ====================

// Crear pasante
const crearPasante = async (req, res) => {
  try {
    const { nombre, email, facultad, celular, horasDePasantia } = req.body;

    if (!nombre || !email || !facultad || !celular) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const emailExiste = await Pasante.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const nuevoPasante = new Pasante({
      nombre,
      email,
      facultad,
      celular,
      horasDePasantia: horasDePasantia || 0
    });

    const token = nuevoPasante.crearToken();
    await nuevoPasante.save();

    sendMailToRegister(nuevoPasante.email, token);

    res.status(201).json({
      msg: "Pasante creado correctamente. Se ha enviado un correo de confirmación",
      pasante: {
        id: nuevoPasante._id,
        nombre: nuevoPasante.nombre,
        email: nuevoPasante.email,
        facultad: nuevoPasante.facultad,
        celular: nuevoPasante.celular,
        horasDePasantia: nuevoPasante.horasDePasantia
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear pasante", error: error.message });
  }
};

// Confirmar pasante
const confirmarPasante = async (req, res) => {
  try {
    const { token } = req.params;

    const pasante = await Pasante.findOne({ token });

    if (!pasante) {
      return res.status(404).json({ msg: "Token no válido o expirado" });
    }

    pasante.confirmEmail = true;
    pasante.token = null;
    await pasante.save();

    res.status(200).json({ msg: "Cuenta confirmada correctamente. Ya puedes iniciar sesión con Google" });
  } catch (error) {
    res.status(500).json({ msg: "Error al confirmar cuenta", error: error.message });
  }
};

// Obtener todos los pasantes
const obtenerPasantes = async (req, res) => {
  try {
    const { search } = req.query;
    let filtro = {};
    
    if (search) {
      const regex = new RegExp(search, "i");
      filtro = { 
        $or: [
          { nombre: regex }, 
          { email: regex },
          { facultad: regex }
        ] 
      };
    }
    
    const pasantes = await Pasante.find(filtro)
      .select("nombre email facultad horasDePasantia celular fotoPerfil status createdAt")
      .sort({ createdAt: -1 });
    
    res.status(200).json(pasantes);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener pasantes", error: error.message });
  }
};

// Obtener pasante por ID
const obtenerPasantePorId = async (req, res) => {
  try {
    const pasante = await Pasante.findById(req.params.id).select("-password -token");
    
    if (!pasante) {
      return res.status(404).json({ msg: "Pasante no encontrado" });
    }
    
    res.status(200).json(pasante);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener pasante", error: error.message });
  }
};

// Actualizar pasante
const actualizarPasante = async (req, res) => {
  try {
    const pasante = await Pasante.findById(req.params.id);
    
    if (!pasante) {
      return res.status(404).json({ msg: "Pasante no encontrado" });
    }

    const { celular, facultad, horasDePasantia } = req.body;

    // Actualizar celular siempre
    if (celular) {
      pasante.celular = celular;
    }

    // Validar permisos para editar facultad y horasDePasantia
    // Si el usuario es admini tipo estudiante no puede editar estos campos
    if (req.user.rol === "admini" && req.user.tipo === "estudiante") {
      if (facultad !== undefined || horasDePasantia !== undefined) {
        return res.status(403).json({
          msg: "Como admini de tipo estudiante, no puedes editar la facultad ni las horas de pasantía"
        });
      }
    } else {
      // Si es administrador o admini administrativo, puede editar todo
      if (facultad !== undefined) {
        pasante.facultad = facultad;
      }
      if (horasDePasantia !== undefined) {
        pasante.horasDePasantia = horasDePasantia;
      }
    }

    await pasante.save();
    
    res.status(200).json({ 
      msg: "Pasante actualizado correctamente", 
      pasante: {
        id: pasante._id,
        nombre: pasante.nombre,
        email: pasante.email,
        facultad: pasante.facultad,
        horasDePasantia: pasante.horasDePasantia,
        celular: pasante.celular
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar pasante", error: error.message });
  }
};

// Eliminar pasante
const eliminarPasante = async (req, res) => {
  try {
    const pasante = await Pasante.findById(req.params.id);
    
    if (!pasante) {
      return res.status(404).json({ msg: "Pasante no encontrado" });
    }

    await pasante.deleteOne();
    res.status(200).json({ msg: "Pasante eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar pasante", error: error.message });
  }
};

export {
  // Autenticación
  loginAdministrador,
  confirmarCuentaAdmini,
  // Perfil
  obtenerPerfilAdministrador,
  actualizarPerfilAdministrador,
  actualizarFotoPerfilAdministrador,
  // Contraseñas
  cambiarPasswordAdministrador,
  solicitarRecuperacionPassword,
  validarTokenRecuperacion,
  recuperarPassword,
  // CRUD Adminis
  crearAdmin,
  listarAdminis,
  obtenerAdminiPorId,
  editarAdmini,
  eliminarAdministrador,
  // CRUD Pasantes
  crearPasante,
  confirmarPasante,
  obtenerPasantes,
  obtenerPasantePorId,
  actualizarPasante,
  eliminarPasante
};