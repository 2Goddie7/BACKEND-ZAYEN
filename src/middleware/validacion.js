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
        msg: "Formato de cédula inválido. Debe contener 10 dígitos" 
      });
    }
  }
  
  next();
};

// Validar formato de celular ecuatoriano (10 dígitos, empieza con 09)
export const validarCelular = (req, res, next) => {
  const { celular } = req.body;
  
  if (celular) {
    const celularRegex = /^09\d{8}$/;
    if (!celularRegex.test(celular)) {
      return res.status(400).json({ 
        msg: "Formato de celular inválido. Debe ser un número ecuatoriano válido (09XXXXXXXX)" 
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