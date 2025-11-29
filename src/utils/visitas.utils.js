import { CONFIG_MUSEO, generarBloquesHorarios } from '../config/museo.config.js';

// Validar si una fecha es día hábil (Lunes a Viernes)
export const esDiaHabil = (fecha) => {
  const diaSemana = fecha.getDay(); // 0=Domingo, 6=Sábado
  return CONFIG_MUSEO.VISITAS.DIAS_OPERACION.includes(diaSemana);
};

// Validar anticipación mínima
export const cumpleAnticipacionMinima = (fechaVisita) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fecha = new Date(fechaVisita);
  fecha.setHours(0, 0, 0, 0);
  
  const diferenciaDias = Math.floor((fecha - hoy) / (1000 * 60 * 60 * 24));
  
  return diferenciaDias >= CONFIG_MUSEO.VISITAS.ANTICIPACION_MINIMA_DIAS;
};

// Validar que la fecha no sea pasada
export const esFechaFutura = (fechaVisita) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fecha = new Date(fechaVisita);
  fecha.setHours(0, 0, 0, 0);
  
  return fecha >= hoy;
};

// Validar que el bloque horario sea valido
export const esBloqueValido = (horaBloque) => {
  const bloquesValidos = generarBloquesHorarios();
  return bloquesValidos.includes(horaBloque);
};

// Generar bloqueId unico (añoMesDia-hora)
export const generarBloqueId = (fechaVisita, horaBloque) => {
  const fecha = new Date(fechaVisita);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const hora = horaBloque.replace(':', '');
  
  return `${year}${month}${day}-${hora}`;
};

// Formatear fecha para display (YYYY-MM-DD)
export const formatearFecha = (fecha) => {
  const f = new Date(fecha);
  const year = f.getFullYear();
  const month = String(f.getMonth() + 1).padStart(2, '0');
  const day = String(f.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Obtener nombre del día de la semana
export const obtenerNombreDia = (fecha) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date(fecha).getDay()];
};

// Validar todas las reglas de fecha y hora
export const validarFechaHoraVisita = (fechaVisita, horaBloque) => {
  const fecha = new Date(fechaVisita);
  
  // Validar que no sea fecha pasada
  if (!esFechaFutura(fechaVisita)) {
    return {
      valido: false,
      mensaje: 'No se pueden registrar visitas en fechas pasadas'
    };
  }
  
  // Validar anticipación mínima
  if (!cumpleAnticipacionMinima(fechaVisita)) {
    return {
      valido: false,
      mensaje: `Las visitas deben registrarse con al menos ${CONFIG_MUSEO.VISITAS.ANTICIPACION_MINIMA_DIAS} día de anticipación`
    };
  }
  
  // Validar día hábil
  if (!esDiaHabil(fecha)) {
    const nombreDia = obtenerNombreDia(fecha);
    return {
      valido: false,
      mensaje: `${nombreDia} no es un día hábil. El museo solo atiende de Lunes a Viernes`
    };
  }
  
  // Validar bloque horario
  if (!esBloqueValido(horaBloque)) {
    return {
      valido: false,
      mensaje: `El bloque horario ${horaBloque} no es válido. Horario de atención: ${CONFIG_MUSEO.VISITAS.HORA_APERTURA} - ${CONFIG_MUSEO.VISITAS.HORA_CIERRE}`
    };
  }
  
  return {
    valido: true,
    mensaje: 'Fecha y hora válidas'
  };
};

// Calcular disponibilidad de un bloque
export const calcularDisponibilidadBloque = (ocupados) => {
  const disponibles = CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE - ocupados;
  const porcentaje = (ocupados / CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE) * 100;
  
  let estado = 'disponible';
  if (ocupados >= CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE) {
    estado = 'completo';
  } else if (porcentaje >= 60) {
    estado = 'casi_lleno';
  }
  
  return {
    ocupados,
    disponibles,
    capacidadMaxima: CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE,
    porcentajeOcupacion: Math.round(porcentaje),
    estado
  };
};