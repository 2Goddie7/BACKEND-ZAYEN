// Configuración centralizada del Museo Gustavo Orcés

export const CONFIG_MUSEO = {
  // ==================== VISITAS ====================
  VISITAS: {
    // Capacidad
    CAPACIDAD_MAXIMA_POR_BLOQUE: 25,
    CANTIDAD_MINIMA_GRUPO: 2,
    CANTIDAD_MAXIMA_GRUPO: 25,
    
    // Horarios
    HORA_APERTURA: "08:00",
    HORA_CIERRE: "16:30",
    DURACION_BLOQUE_MINUTOS: 30,
    
    // Días de operación (1=Lunes, 5=Viernes)
    DIAS_OPERACION: [1, 2, 3, 4, 5],
    
    // Anticipación
    ANTICIPACION_MINIMA_DIAS: 1,
    ANTICIPACION_MAXIMA_DIAS: null, // Sin límite
    
    // Mensajes
    NOTA_FERIADOS: "⚠️ Recuerde no registrar visitas en días feriados nacionales",
    
    // Estados
    ESTADOS: ['pendiente', 'realizada', 'cancelada'],
    DESCRIPCION_DEFAULT_REALIZADA: 'sin novedad'
  },
  
  // ==================== DONACIONES ====================
  DONACIONES: {
    TIPOS: ['economica', 'bienes'],
    ESTADOS_ECONOMICA: ['pendiente', 'completada', 'fallida'],
    ESTADOS_BIENES: ['pendiente', 'aceptada', 'no_aceptada'],
    ESTADOS_BIEN: ['nuevo', 'usado'],
    MAX_FILE_SIZE_MB: 5,
    DESCRIPCION_DEFAULT: 'ninguna'
  },
  
  // ==================== VALIDACIONES ====================
  VALIDACIONES: {
    NOMBRE_MIN_LENGTH: 3,
    NOMBRE_MAX_LENGTH: 100,
    NOMBRE_REGEX: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  }
};

// Generar bloques horarios del día
export const generarBloquesHorarios = () => {
  const bloques = [];
  const [horaInicio] = CONFIG_MUSEO.VISITAS.HORA_APERTURA.split(':').map(Number);
  const [horaCierre, minCierre] = CONFIG_MUSEO.VISITAS.HORA_CIERRE.split(':').map(Number);
  
  let horaActual = horaInicio;
  let minActual = 0;
  
  while (horaActual < horaCierre || (horaActual === horaCierre && minActual < minCierre)) {
    const horaStr = `${String(horaActual).padStart(2, '0')}:${String(minActual).padStart(2, '0')}`;
    bloques.push(horaStr);
    
    minActual += CONFIG_MUSEO.VISITAS.DURACION_BLOQUE_MINUTOS;
    if (minActual >= 60) {
      horaActual++;
      minActual = 0;
    }
  }
  
  return bloques;
};

export default CONFIG_MUSEO;