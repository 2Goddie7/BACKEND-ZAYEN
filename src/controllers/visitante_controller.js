import Visitante from "../models/Visitante.js";

// ==================== CRUD VISITANTES ====================

// Crear visitante (Accesible por: Administrador, Admini, Pasante y Usuario Público)
const crearVisitante = async (req, res) => {
  try {
    const { nombre, cedula, institucion, fecha } = req.body;

    // Validaciones
    if (!nombre || !cedula || !institucion) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const nuevoVisitante = new Visitante({
      nombre,
      cedula,
      institucion,
      fecha: fecha || Date.now()
    });

    await nuevoVisitante.save();

    res.status(201).json({
      msg: "Visitante registrado correctamente",
      visitante: {
        id: nuevoVisitante._id,
        nombre: nuevoVisitante.nombre,
        cedula: nuevoVisitante.cedula,
        institucion: nuevoVisitante.institucion,
        fecha: nuevoVisitante.fecha
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear visitante", error: error.message });
  }
};

// Obtener todos los visitantes
const obtenerVisitantes = async (req, res) => {
  try {
    const { search, fecha, institucion } = req.query;
    let filtro = {};

    // Filtro por búsqueda general
    if (search) {
      const regex = new RegExp(search, "i");
      filtro = {
        $or: [
          { nombre: regex },
          { cedula: regex },
          { institucion: regex }
        ]
      };
    }

    // Filtro por institución específica
    if (institucion) {
      filtro.institucion = new RegExp(institucion, "i");
    }

    // Filtro por fecha
    if (fecha) {
      const fechaBuscada = new Date(fecha);
      const inicioDia = new Date(fechaBuscada.setHours(0, 0, 0, 0));
      const finDia = new Date(fechaBuscada.setHours(23, 59, 59, 999));
      filtro.fecha = { $gte: inicioDia, $lte: finDia };
    }

    const visitantes = await Visitante.find(filtro)
      .sort({ fecha: -1 });

    res.status(200).json({
      total: visitantes.length,
      visitantes
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener visitantes", error: error.message });
  }
};

// Obtener visitante por ID
const obtenerVisitantePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const visitante = await Visitante.findById(id);

    if (!visitante) {
      return res.status(404).json({ msg: "Visitante no encontrado" });
    }

    res.status(200).json(visitante);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener visitante", error: error.message });
  }
};

// Eliminar visitante
const eliminarVisitante = async (req, res) => {
  try {
    const { id } = req.params;
    const visitante = await Visitante.findById(id);

    if (!visitante) {
      return res.status(404).json({ msg: "Visitante no encontrado" });
    }

    await visitante.deleteOne();
    res.status(200).json({ msg: "Visitante eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar visitante", error: error.message });
  }
};

// Obtener estadísticas de visitantes
const obtenerEstadisticasVisitantes = async (req, res) => {
  try {
    const totalVisitantes = await Visitante.countDocuments();

    // Visitantes por mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const visitantesMesActual = await Visitante.countDocuments({
      fecha: { $gte: inicioMes }
    });

    // Visitantes por institución
    const visitantesPorInstitucion = await Visitante.aggregate([
      {
        $group: {
          _id: "$institucion",
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      totalVisitantes,
      visitantesMesActual,
      visitantesPorInstitucion
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener estadísticas", error: error.message });
  }
};

export {
  crearVisitante,
  obtenerVisitantes,
  obtenerVisitantePorId,
  eliminarVisitante,
  obtenerEstadisticasVisitantes
};