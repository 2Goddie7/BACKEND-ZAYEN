import Visita from "../models/Visita.js";
import { CONFIG_MUSEO, generarBloquesHorarios } from "../config/museo.config.js";
import {
  validarFechaHoraVisita,
  generarBloqueId,
  formatearFecha,
  calcularDisponibilidadBloque,
  esDiaHabil,
  obtenerNombreDia
} from "../utils/visitas.utils.js";

// ==================== CREAR VISITA ====================
const crearVisita = async (req, res) => {
  try {
    // ✅ Incluir descripcion en la desestructuración
    const { institucion, cantidadPersonas, fechaVisita, horaBloque, descripcion } = req.body;

    // Validar campos requeridos
    if (!institucion || !cantidadPersonas || !fechaVisita || !horaBloque) {
      return res.status(400).json({ 
        msg: "Todos los campos son obligatorios",
        camposRequeridos: ["institucion", "cantidadPersonas", "fechaVisita", "horaBloque"]
      });
    }

    // Validar fecha y hora
    const validacion = validarFechaHoraVisita(fechaVisita, horaBloque);
    if (!validacion.valido) {
      return res.status(400).json({ 
        msg: validacion.mensaje,
        notaFeriados: CONFIG_MUSEO.VISITAS.NOTA_FERIADOS
      });
    }

    // Generar bloqueId
    const bloqueId = generarBloqueId(fechaVisita, horaBloque);

    // Validar capacidad del bloque
    const capacidad = await Visita.validarCapacidadBloque(bloqueId, cantidadPersonas);

    if (!capacidad.permitido) {
      return res.status(400).json({
        msg: `El bloque ${horaBloque} está completo o excedería la capacidad`,
        capacidadActual: capacidad.personasActuales,
        capacidadMaxima: capacidad.capacidadMaxima,
        disponibles: capacidad.disponibles,
        solicitadas: cantidadPersonas,
        sugerencia: capacidad.disponibles > 0 
          ? `Solo hay ${capacidad.disponibles} cupos disponibles en este bloque`
          : "Por favor, seleccione otro horario"
      });
    }

    // Crear la visita - ✅ Incluir descripcion
    const nuevaVisita = new Visita({
      institucion,
      cantidadPersonas,
      fechaVisita: new Date(fechaVisita),
      horaBloque,
      bloqueId,
      status: 'pendiente',
      descripcion: descripcion || '' // ✅ Campo opcional
    });

    await nuevaVisita.save();

    // ✅ Incluir descripcion en la respuesta
    res.status(201).json({
      msg: "Visita registrada correctamente",
      visita: {
        id: nuevaVisita._id,
        institucion: nuevaVisita.institucion,
        cantidadPersonas: nuevaVisita.cantidadPersonas,
        fechaVisita: formatearFecha(nuevaVisita.fechaVisita),
        horaBloque: nuevaVisita.horaBloque,
        status: nuevaVisita.status,
        descripcion: nuevaVisita.descripcion // ✅ Incluir en respuesta
      },
      capacidadBloque: {
        ocupados: capacidad.personasActuales + cantidadPersonas,
        disponibles: capacidad.disponibles - cantidadPersonas,
        capacidadMaxima: capacidad.capacidadMaxima
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al crear visita", 
      error: error.message 
    });
  }
};

// ==================== OBTENER VISITAS ====================
const obtenerVisitas = async (req, res) => {
  try {
    const { search, fecha, institucion, status, horaBloque } = req.query;
    let filtro = {};

    // Filtro por búsqueda general
    if (search) {
      const regex = new RegExp(search, "i");
      filtro.institucion = regex;
    }

    // Filtro por institución específica
    if (institucion) {
      filtro.institucion = new RegExp(institucion, "i");
    }

    // Filtro por status
    if (status) {
      filtro.status = status;
    }

    // Filtro por hora de bloque
    if (horaBloque) {
      filtro.horaBloque = horaBloque;
    }

    // Filtro por fecha
    if (fecha) {
      const fechaBuscada = new Date(fecha);
      const inicioDia = new Date(fechaBuscada.setHours(0, 0, 0, 0));
      const finDia = new Date(fechaBuscada.setHours(23, 59, 59, 999));
      filtro.fechaVisita = { $gte: inicioDia, $lte: finDia };
    }

    const visitas = await Visita.find(filtro)
      .sort({ fechaVisita: 1, horaBloque: 1 });

    // Calcular totales
    const totalPersonas = visitas
      .filter(v => v.status !== 'cancelada')
      .reduce((sum, visita) => sum + visita.cantidadPersonas, 0);

    // ✅ Incluir descripcion en el mapeo
    res.status(200).json({
      total: visitas.length,
      totalPersonas,
      visitas: visitas.map(v => ({
        id: v._id,
        institucion: v.institucion,
        cantidadPersonas: v.cantidadPersonas,
        fechaVisita: formatearFecha(v.fechaVisita),
        horaBloque: v.horaBloque,
        status: v.status,
        descripcion: v.descripcion, // ✅ Incluir descripcion
        createdAt: v.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al obtener visitas", 
      error: error.message 
    });
  }
};

// ==================== OBTENER VISITA POR ID ====================
const obtenerVisitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ msg: "Visita no encontrada" });
    }

    // ✅ Incluir descripcion en la respuesta
    res.status(200).json({
      id: visita._id,
      institucion: visita.institucion,
      cantidadPersonas: visita.cantidadPersonas,
      fechaVisita: formatearFecha(visita.fechaVisita),
      horaBloque: visita.horaBloque,
      bloqueId: visita.bloqueId,
      status: visita.status,
      descripcion: visita.descripcion, // ✅ Incluir descripcion
      createdAt: visita.createdAt,
      updatedAt: visita.updatedAt
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al obtener visita", 
      error: error.message 
    });
  }
};

// ==================== ACTUALIZAR ESTADO DE VISITA ====================
const actualizarEstadoVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, descripcion } = req.body;

    // Validar campos requeridos
    if (!status) {
      return res.status(400).json({ 
        msg: "El estado es requerido",
        estadosPermitidos: CONFIG_MUSEO.VISITAS.ESTADOS
      });
    }

    // Validar que el estado sea válido
    if (!CONFIG_MUSEO.VISITAS.ESTADOS.includes(status)) {
      return res.status(400).json({ 
        msg: `Estado inválido. Estados permitidos: ${CONFIG_MUSEO.VISITAS.ESTADOS.join(', ')}` 
      });
    }

    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ msg: "Visita no encontrada" });
    }

    // Validar que se proporcione descripción para visitas canceladas
    if (status === 'cancelada' && (!descripcion || descripcion.trim() === '')) {
      return res.status(400).json({ 
        msg: "Debe proporcionar el motivo de la cancelación en el campo descripción" 
      });
    }

    // Actualizar estado
    visita.status = status;

    // Actualizar descripción
    if (status === 'realizada') {
      visita.descripcion = descripcion && descripcion.trim() !== '' 
        ? descripcion 
        : CONFIG_MUSEO.VISITAS.DESCRIPCION_DEFAULT_REALIZADA;
    } else if (status === 'cancelada') {
      visita.descripcion = descripcion;
    }

    await visita.save();

    // ✅ Incluir descripcion en la respuesta
    res.status(200).json({
      msg: `Visita marcada como ${status}`,
      visita: {
        id: visita._id,
        institucion: visita.institucion,
        cantidadPersonas: visita.cantidadPersonas,
        fechaVisita: formatearFecha(visita.fechaVisita),
        horaBloque: visita.horaBloque,
        status: visita.status,
        descripcion: visita.descripcion // ✅ Incluir descripcion
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al actualizar estado", 
      error: error.message 
    });
  }
};

// ==================== ELIMINAR VISITA ====================
const eliminarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ msg: "Visita no encontrada" });
    }

    await visita.deleteOne();
    
    res.status(200).json({ 
      msg: "Visita eliminada correctamente",
      visitaEliminada: {
        institucion: visita.institucion,
        fechaVisita: formatearFecha(visita.fechaVisita),
        horaBloque: visita.horaBloque
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al eliminar visita", 
      error: error.message 
    });
  }
};

// ==================== CONSULTAR DISPONIBILIDAD ====================
const consultarDisponibilidad = async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ 
        msg: "La fecha es requerida",
        formato: "YYYY-MM-DD"
      });
    }

    const fechaConsulta = new Date(fecha);

    // Validar que sea día hábil
    if (!esDiaHabil(fechaConsulta)) {
      return res.status(400).json({
        msg: `${obtenerNombreDia(fechaConsulta)} no es un día hábil`,
        diasHabiles: "Lunes a Viernes",
        nota: CONFIG_MUSEO.VISITAS.NOTA_FERIADOS
      });
    }

    // Obtener todas las visitas del día (excluyendo canceladas)
    const visitasDelDia = await Visita.obtenerVisitasPorBloque(fechaConsulta);

    // Crear mapa de ocupación
    const ocupacionPorBloque = {};
    visitasDelDia.forEach(item => {
      ocupacionPorBloque[item._id] = {
        totalPersonas: item.totalPersonas,
        visitas: item.visitas
      };
    });

    // Generar todos los bloques disponibles
    const bloquesHorarios = generarBloquesHorarios();
    const disponibilidad = bloquesHorarios.map(hora => {
      const ocupados = ocupacionPorBloque[hora]?.totalPersonas || 0;
      const info = calcularDisponibilidadBloque(ocupados);
      
      return {
        hora,
        ...info,
        visitas: ocupacionPorBloque[hora]?.visitas || []
      };
    });

    res.status(200).json({
      fecha: formatearFecha(fechaConsulta),
      diaSemana: obtenerNombreDia(fechaConsulta),
      horarioAtencion: `${CONFIG_MUSEO.VISITAS.HORA_APERTURA} - ${CONFIG_MUSEO.VISITAS.HORA_CIERRE}`,
      horarioAlmuerzo: `${CONFIG_MUSEO.VISITAS.HORA_INICIO_ALMUERZO} - ${CONFIG_MUSEO.VISITAS.HORA_FIN_ALMUERZO}`, // ✅ Nuevo
      capacidadMaximaPorBloque: CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE,
      bloques: disponibilidad,
      nota: CONFIG_MUSEO.VISITAS.NOTA_FERIADOS
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al consultar disponibilidad", 
      error: error.message 
    });
  }
};

// ==================== SUGERIR HORARIOS DISPONIBLES ====================
const sugerirHorariosDisponibles = async (req, res) => {
  try {
    const { fecha, personas } = req.query;

    if (!fecha || !personas) {
      return res.status(400).json({ 
        msg: "Fecha y cantidad de personas son requeridas",
        ejemplo: "/api/visitas/sugerir-horarios?fecha=2025-11-25&personas=15"
      });
    }

    const cantidadPersonas = parseInt(personas);

    if (isNaN(cantidadPersonas) || cantidadPersonas < CONFIG_MUSEO.VISITAS.CANTIDAD_MINIMA_GRUPO) {
      return res.status(400).json({
        msg: `La cantidad mínima de personas es ${CONFIG_MUSEO.VISITAS.CANTIDAD_MINIMA_GRUPO}`
      });
    }

    if (cantidadPersonas > CONFIG_MUSEO.VISITAS.CANTIDAD_MAXIMA_GRUPO) {
      return res.status(400).json({
        msg: `La cantidad máxima de personas por visita es ${CONFIG_MUSEO.VISITAS.CANTIDAD_MAXIMA_GRUPO}`
      });
    }

    const fechaConsulta = new Date(fecha);

    // Validar que sea día hábil
    if (!esDiaHabil(fechaConsulta)) {
      return res.status(400).json({
        msg: `${obtenerNombreDia(fechaConsulta)} no es un día hábil`,
        diasHabiles: "Lunes a Viernes"
      });
    }

    // Obtener ocupación actual
    const visitasDelDia = await Visita.obtenerVisitasPorBloque(fechaConsulta);
    const ocupacionPorBloque = {};
    visitasDelDia.forEach(item => {
      ocupacionPorBloque[item._id] = item.totalPersonas;
    });

    // Filtrar bloques con espacio suficiente
    const bloquesHorarios = generarBloquesHorarios();
    const bloquesDisponibles = bloquesHorarios
      .map(hora => {
        const ocupados = ocupacionPorBloque[hora] || 0;
        const disponibles = CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE - ocupados;
        
        return {
          hora,
          espacioDisponible: disponibles,
          suficiente: disponibles >= cantidadPersonas
        };
      })
      .filter(bloque => bloque.suficiente);

    if (bloquesDisponibles.length === 0) {
      return res.status(200).json({
        msg: `No hay bloques disponibles para ${cantidadPersonas} personas en esta fecha`,
        fecha: formatearFecha(fechaConsulta),
        sugerencia: "Por favor, intente con otra fecha o reduzca la cantidad de personas"
      });
    }

    res.status(200).json({
      fecha: formatearFecha(fechaConsulta),
      personasSolicitadas: cantidadPersonas,
      bloquesDisponibles: bloquesDisponibles.map(b => ({
        hora: b.hora,
        espacioDisponible: b.espacioDisponible
      })),
      totalBloques: bloquesDisponibles.length,
      mensaje: `Hay ${bloquesDisponibles.length} bloques disponibles para ${cantidadPersonas} personas`
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al sugerir horarios", 
      error: error.message 
    });
  }
};

// ==================== ESTADÍSTICAS ====================
const obtenerEstadisticasVisitas = async (req, res) => {
  try {
    const totalVisitas = await Visita.countDocuments({ status: { $ne: 'cancelada' } });

    // Total de personas que han visitado
    const totalPersonas = await Visita.aggregate([
      { $match: { status: { $ne: 'cancelada' } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$cantidadPersonas" }
        }
      }
    ]);

    // Visitas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const visitasMesActual = await Visita.countDocuments({
      fechaVisita: { $gte: inicioMes },
      status: { $ne: 'cancelada' }
    });

    const personasMesActual = await Visita.aggregate([
      {
        $match: { 
          fechaVisita: { $gte: inicioMes },
          status: { $ne: 'cancelada' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$cantidadPersonas" }
        }
      }
    ]);

    // Visitas por institución
    const visitasPorInstitucion = await Visita.aggregate([
      { $match: { status: { $ne: 'cancelada' } } },
      {
        $group: {
          _id: "$institucion",
          totalVisitas: { $sum: 1 },
          totalPersonas: { $sum: "$cantidadPersonas" }
        }
      },
      { $sort: { totalVisitas: -1 } },
      { $limit: 10 }
    ]);

    // Visitas por status
    const visitasPorStatus = await Visita.aggregate([
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      totalVisitas,
      totalPersonas: totalPersonas[0]?.total || 0,
      visitasMesActual,
      personasMesActual: personasMesActual[0]?.total || 0,
      visitasPorInstitucion,
      visitasPorStatus,
      capacidadDiariaMaxima: CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE * generarBloquesHorarios().length
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al obtener estadísticas", 
      error: error.message 
    });
  }
};

export {
  crearVisita,
  obtenerVisitas,
  obtenerVisitaPorId,
  actualizarEstadoVisita,
  eliminarVisita,
  consultarDisponibilidad,
  sugerirHorariosDisponibles,
  obtenerEstadisticasVisitas
};