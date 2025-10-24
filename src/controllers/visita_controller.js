import Visita from "../models/Visita.js";

// ==================== CRUD VISITAS ====================

// Crear visita (Accesible por: Administrador, Admini, Pasante)
const crearVisita = async (req, res) => {
  try {
    const { institucion, cantidadPersonas, fecha } = req.body;

    // Validaciones
    if (!institucion || !cantidadPersonas) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    if (cantidadPersonas < 2) {
      return res.status(400).json({ msg: "La cantidad de personas para registrar una visita debe ser al menos 2" });
    }

    const nuevaVisita = new Visita({
      institucion,
      cantidadPersonas,
      fecha: fecha || Date.now()
    });

    await nuevaVisita.save();

    res.status(201).json({
      msg: "Visita registrada correctamente",
      visita: {
        id: nuevaVisita._id,
        institucion: nuevaVisita.institucion,
        cantidadPersonas: nuevaVisita.cantidadPersonas,
        fecha: nuevaVisita.fecha
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear visita", error: error.message });
  }
};

// Obtener todas las visitas
const obtenerVisitas = async (req, res) => {
  try {
    const { search, fecha, institucion } = req.query;
    let filtro = {};

    // Filtro por búsqueda general
    if (search) {
      filtro.institucion = new RegExp(search, "i");
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

    const visitas = await Visita.find(filtro)
      .sort({ fecha: -1 });

    // Calcular total de personas
    const totalPersonas = visitas.reduce((sum, visita) => sum + visita.cantidadPersonas, 0);

    res.status(200).json({
      total: visitas.length,
      totalPersonas,
      visitas
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener visitas", error: error.message });
  }
};

// Obtener visita por ID
const obtenerVisitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ msg: "Visita no encontrada" });
    }

    res.status(200).json(visita);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener visita", error: error.message });
  }
};

// Eliminar visita
const eliminarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findById(id);

    if (!visita) {
      return res.status(404).json({ msg: "Visita no encontrada" });
    }

    await visita.deleteOne();
    res.status(200).json({ msg: "Visita eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar visita", error: error.message });
  }
};

// Obtener estadísticas de visitas
const obtenerEstadisticasVisitas = async (req, res) => {
  try {
    const totalVisitas = await Visita.countDocuments();

    // Total de personas que han visitado
    const totalPersonas = await Visita.aggregate([
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
      fecha: { $gte: inicioMes }
    });

    const personasMesActual = await Visita.aggregate([
      {
        $match: { fecha: { $gte: inicioMes } }
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

    res.status(200).json({
      totalVisitas,
      totalPersonas: totalPersonas[0]?.total || 0,
      visitasMesActual,
      personasMesActual: personasMesActual[0]?.total || 0,
      visitasPorInstitucion
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener estadísticas", error: error.message });
  }
};

export {
  crearVisita,
  obtenerVisitas,
  obtenerVisitaPorId,
  eliminarVisita,
  obtenerEstadisticasVisitas
};