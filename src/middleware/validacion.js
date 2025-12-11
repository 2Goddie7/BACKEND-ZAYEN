import { CONFIG_MUSEO } from '../config/museo.config.js';

// Middleware para validar campos requeridos
export const validarCamposRequeridos = (camposRequeridos) => {
  return (req, res, next) => {
    const camposFaltantes = [];
    
    camposRequeridos.forEach(campo => {
      if (!req.body[campo] || req.body[campo].toString().trim() === '') {
        camposFaltantes.push(campo);
      }
    });
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        msg: "Campos requeridos faltantes",
        camposFaltantes
      });
    }
    
    next();
  };
};

// Validar formato de email
export const validarEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Formato de email inválido" });
    }
  }
  
  next();
};

// Validar formato de cédula ecuatoriana (10 dígitos)
export const validarCedula = (req, res, next) => {
  const { cedula } = req.body;
  
  if (cedula) {
    const cedulaRegex = /^\d{10}$/;
    if (!cedulaRegex.test(cedula)) {
      return res.status(400).json({ 
        msg: "La cédula debe contener 10 dígitos" 
      });
    }
  }
  
  next();
};

// Validar formato de celular
export const validarCelular = (req, res, next) => {
  const { celular } = req.body;
  
  if (celular) {
    const celularRegex = /^09\d{8}$/;
    if (!celularRegex.test(celular)) {
      return res.status(400).json({ 
        msg: "Ingresa un número de celular válido (Ej. 0978654321)" 
      });
    }
  }
  
  next();
};

// Validar que el monto sea positivo
export const validarMonto = (req, res, next) => {
  const { monto } = req.body;
  
  if (monto !== undefined) {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ 
        msg: "El monto debe ser un número positivo"
      });
    }
  }
  
  next();
};

// Validar que las horas de pasantía sean válidas
export const validarHorasPasantia = (req, res, next) => {
  const { horasDePasantia } = req.body;
  
  if (horasDePasantia !== undefined) {
    const horas = parseInt(horasDePasantia);
    if (isNaN(horas) || horas < 0) {
      return res.status(400).json({ 
        msg: "Las horas de pasantía deben ser un número positivo o cero" 
      });
    }
  }
  
  next();
};

// Validar contraseña segura (mínimo 8 caracteres)
export const validarPassword = (req, res, next) => {
  const { password, nuevaPassword } = req.body;
  const passwordToValidate = password || nuevaPassword;
  
  if (passwordToValidate) {
    if (passwordToValidate.length < 8) {
      return res.status(400).json({ 
        msg: "La contraseña debe tener al menos 8 caracteres" 
      });
    }
  }
  
  next();
};

// ==================== NUEVAS VALIDACIONES ====================

// Validar nombre
export const validarNombre = (req, res, next) => {
  const { nombre, nombreDonante } = req.body;
  const nombreValidar = nombre || nombreDonante;
  
  if (nombreValidar) {
    const { NOMBRE_MIN_LENGTH, NOMBRE_MAX_LENGTH, NOMBRE_REGEX } = CONFIG_MUSEO.VALIDACIONES;
    
    // Validar longitud mínima
    if (nombreValidar.trim().length < NOMBRE_MIN_LENGTH) {
      return res.status(400).json({ 
        msg: `El nombre debe tener al menos ${NOMBRE_MIN_LENGTH} caracteres` 
      });
    }
    
    // Validar longitud máxima
    if (nombreValidar.trim().length > NOMBRE_MAX_LENGTH) {
      return res.status(400).json({ 
        msg: `El nombre no debe exceder ${NOMBRE_MAX_LENGTH} caracteres` 
      });
    }
    
    // Validar que solo contenga letras y espacios (incluye acentos y ñ)
    if (!NOMBRE_REGEX.test(nombreValidar)) {
      return res.status(400).json({ 
        msg: "El nombre solo puede contener letras y espacios" 
      });
    }
    
    // Validar que no sea solo espacios o caracteres repetidos
    const nombreSinEspacios = nombreValidar.replace(/\s/g, '');
    const caracteresUnicos = new Set(nombreSinEspacios.toLowerCase()).size;
    
    if (caracteresUnicos < 2) {
      return res.status(400).json({ 
        msg: "El nombre no es válido" 
      });
    }
  }
  
  next();
};

// Validar nombre de institución
export const validarInstitucion = (req, res, next) => {
  const { institucion } = req.body;
  
  if (institucion) {
    const { NOMBRE_MIN_LENGTH, NOMBRE_MAX_LENGTH } = CONFIG_MUSEO.VALIDACIONES;
    
    if (institucion.trim().length < NOMBRE_MIN_LENGTH) {
      return res.status(400).json({ 
        msg: `El nombre de la institución debe tener al menos ${NOMBRE_MIN_LENGTH} caracteres` 
      });
    }
    
    if (institucion.trim().length > NOMBRE_MAX_LENGTH) {
      return res.status(400).json({ 
        msg: `El nombre de la institución no debe exceder ${NOMBRE_MAX_LENGTH} caracteres` 
      });
    }
  }
  
  next();
};

// Validar cantidad de personas para visitas
export const validarCantidadPersonas = (req, res, next) => {
  const { cantidadPersonas } = req.body;
  
  if (cantidadPersonas !== undefined) {
    const cantidad = parseInt(cantidadPersonas);
    
    if (isNaN(cantidad)) {
      return res.status(400).json({ 
        msg: "La cantidad de personas debe ser un número" 
      });
    }
    
    if (cantidad < CONFIG_MUSEO.VISITAS.CANTIDAD_MINIMA_GRUPO) {
      return res.status(400).json({ 
        msg: `La cantidad mínima de personas es ${CONFIG_MUSEO.VISITAS.CANTIDAD_MINIMA_GRUPO}` 
      });
    }
    
    if (cantidad > CONFIG_MUSEO.VISITAS.CANTIDAD_MAXIMA_GRUPO) {
      return res.status(400).json({ 
        msg: `La cantidad máxima de personas por visita es ${CONFIG_MUSEO.VISITAS.CANTIDAD_MAXIMA_GRUPO}` 
      });
    }
  }
  
  next();
};

// Validar tipo de donación
export const validarTipoDonacion = (req, res, next) => {
  const { tipoDonacion } = req.body;
  
  if (tipoDonacion && !CONFIG_MUSEO.DONACIONES.TIPOS.includes(tipoDonacion)) {
    return res.status(400).json({ 
      msg: `Tipo de donación inválido. Tipos permitidos: ${CONFIG_MUSEO.DONACIONES.TIPOS.join(', ')}` 
    });
  }
  
  next();
};

// Validar estado del bien
export const validarEstadoBien = (req, res, next) => {
  const { estadoBien } = req.body;
  
  if (estadoBien && !CONFIG_MUSEO.DONACIONES.ESTADOS_BIEN.includes(estadoBien)) {
    return res.status(400).json({ 
      msg: `Estado del bien inválido. Estados permitidos: ${CONFIG_MUSEO.DONACIONES.ESTADOS_BIEN.join(', ')}` 
    });
  }
  
  next();
};