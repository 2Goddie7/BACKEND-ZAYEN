import Donacion from "../models/Donacion.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { CONFIG_MUSEO } from "../config/museo.config.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

// ==================== DONACIÓN ECONÓMICA ====================

// Crear donación económica
const crearDonacionEconomica = async (req, res) => {
  try {
    const { nombreDonante, institucion, monto, descripcion } = req.body;

    // Validaciones
    if (!nombreDonante || !institucion || !monto) {
      return res.status(400).json({ 
        msg: "Todos los campos son obligatorios",
        camposRequeridos: ["nombreDonante", "institucion", "monto"]
      });
    }

    if (monto <= 0) {
      return res.status(400).json({ msg: "El monto debe ser mayor a 0" });
    }

    const nuevaDonacion = new Donacion({
      nombreDonante,
      institucion,
      tipoDonacion: 'economica',
      monto,
      descripcion: descripcion || CONFIG_MUSEO.DONACIONES.DESCRIPCION_DEFAULT,
      status: 'pendiente'
    });

    await nuevaDonacion.save();

    res.status(201).json({
      msg: "Donación económica registrada. Procede al pago",
      donacion: {
        id: nuevaDonacion._id,
        nombreDonante: nuevaDonacion.nombreDonante,
        institucion: nuevaDonacion.institucion,
        tipoDonacion: nuevaDonacion.tipoDonacion,
        monto: nuevaDonacion.monto,
        descripcion: nuevaDonacion.descripcion,
        fecha: nuevaDonacion.fecha,
        status: nuevaDonacion.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al crear donación económica", 
      error: error.message 
    });
  }
};

// Crear sesión de pago con Stripe
const crearSesionPagoStripe = async (req, res) => {
  try {
    const { donacionId } = req.body;

    if (!donacionId) {
      return res.status(400).json({ msg: "El ID de donación es requerido" });
    }

    const donacion = await Donacion.findById(donacionId);
    
    if (!donacion) {
      return res.status(404).json({ msg: "Donación no encontrada" });
    }

    // Validar que sea donación económica
    if (donacion.tipoDonacion !== 'economica') {
      return res.status(400).json({ 
        msg: "Solo las donaciones económicas requieren pago con Stripe" 
      });
    }

    if (donacion.status === "completada") {
      return res.status(400).json({ msg: "Esta donación ya fue completada" });
    }

    // Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donación al Museo Gustavo Orcés`,
              description: `Donación de ${donacion.nombreDonante} - ${donacion.institucion}`,
            },
            unit_amount: Math.round(donacion.monto * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.URL_FRONTEND}/donacion/exitosa?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL_FRONTEND}/donacion/cancelada`,
      metadata: {
        donacionId: donacion._id.toString(),
        tipoDonacion: 'economica'
      },
    });

    // Guardar el ID de la sesión en la donación
    donacion.stripePaymentId = session.id;
    await donacion.save();

    res.status(200).json({
      msg: "Sesión de pago creada",
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al crear sesión de pago", 
      error: error.message 
    });
  }
};

// Webhook de Stripe para confirmar pago
const webhookStripe = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const donacionId = session.metadata.donacionId;

    // Actualizar el estado de la donación
    const donacion = await Donacion.findById(donacionId);
    if (donacion && donacion.tipoDonacion === 'economica') {
      donacion.status = "completada";
      donacion.stripePaymentId = session.payment_intent;
      await donacion.save();
    }
  }

  res.json({ received: true });
};

// Verificar estado de pago
const verificarEstadoPago = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Sesión no encontrada" });
    }

    const donacion = await Donacion.findOne({ stripePaymentId: sessionId });

    res.status(200).json({
      paymentStatus: session.payment_status,
      donacion: donacion ? {
        id: donacion._id,
        nombreDonante: donacion.nombreDonante,
        institucion: donacion.institucion,
        monto: donacion.monto,
        status: donacion.status,
        fecha: donacion.fecha
      } : null
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al verificar estado de pago", 
      error: error.message 
    });
  }
};

// ==================== DONACIÓN DE BIENES ====================

// Crear donación de bienes
const crearDonacionBienes = async (req, res) => {
  try {
    const { nombreDonante, institucion, descripcionBien, estadoBien, descripcion } = req.body;

    // Validaciones
    if (!nombreDonante || !institucion || !descripcionBien || !estadoBien) {
      return res.status(400).json({ 
        msg: "Todos los campos son obligatorios",
        camposRequeridos: ["nombreDonante", "institucion", "descripcionBien", "estadoBien", "fotoBien"]
      });
    }

    // Validar que se haya subido una foto
    if (!req.file) {
      return res.status(400).json({ msg: "La foto del bien es requerida" });
    }

    // Validar estado del bien
    if (!CONFIG_MUSEO.DONACIONES.ESTADOS_BIEN.includes(estadoBien)) {
      return res.status(400).json({ 
        msg: `Estado del bien inválido. Estados permitidos: ${CONFIG_MUSEO.DONACIONES.ESTADOS_BIEN.join(', ')}` 
      });
    }

    const nuevaDonacion = new Donacion({
      nombreDonante,
      institucion,
      tipoDonacion: 'bienes',
      descripcionBien,
      estadoBien,
      fotoBien: req.file.path,
      descripcion: descripcion || CONFIG_MUSEO.DONACIONES.DESCRIPCION_DEFAULT,
      monto: 1,
      status: 'pendiente'
    });

    await nuevaDonacion.save();

    res.status(201).json({
      msg: "Donación de bienes registrada correctamente. Será revisada por el equipo del museo",
      donacion: {
        id: nuevaDonacion._id,
        nombreDonante: nuevaDonacion.nombreDonante,
        institucion: nuevaDonacion.institucion,
        tipoDonacion: nuevaDonacion.tipoDonacion,
        descripcionBien: nuevaDonacion.descripcionBien,
        estadoBien: nuevaDonacion.estadoBien,
        fotoBien: nuevaDonacion.fotoBien,
        descripcion: nuevaDonacion.descripcion,
        fecha: nuevaDonacion.fecha,
        status: nuevaDonacion.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al crear donación de bienes", 
      error: error.message 
    });
  }
};

// Actualizar estado de donación de bienes (Aceptar/Rechazar)
const actualizarEstadoDonacionBienes = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar que el status sea válido para donaciones de bienes
    if (!CONFIG_MUSEO.DONACIONES.ESTADOS_BIENES.includes(status)) {
      return res.status(400).json({ 
        msg: `Estado inválido para donaciones de bienes. Estados permitidos: ${CONFIG_MUSEO.DONACIONES.ESTADOS_BIENES.join(', ')}` 
      });
    }

    const donacion = await Donacion.findById(id);

    if (!donacion) {
      return res.status(404).json({ msg: "Donación no encontrada" });
    }

    // Validar que sea donación de bienes
    if (donacion.tipoDonacion !== 'bienes') {
      return res.status(400).json({ 
        msg: "Esta acción solo aplica a donaciones de bienes" 
      });
    }

    // Actualizar estado
    donacion.status = status;
    await donacion.save();

    res.status(200).json({
      msg: `Donación de bienes ${status === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`,
      donacion: {
        id: donacion._id,
        nombreDonante: donacion.nombreDonante,
        institucion: donacion.institucion,
        descripcionBien: donacion.descripcionBien,
        estadoBien: donacion.estadoBien,
        status: donacion.status,
        fecha: donacion.fecha
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al actualizar estado de donación", 
      error: error.message 
    });
  }
};

// ==================== CONSULTAS Y LISTADOS ====================

// Obtener todas las donaciones
const obtenerDonaciones = async (req, res) => {
  try {
    const { search, status, tipoDonacion, fechaInicio, fechaFin } = req.query;
    let filtro = {};

    // filtro por búsqueda
    if (search) {
      const regex = new RegExp(search, "i");
      filtro.$or = [
        { nombreDonante: regex },
        { institucion: regex }
      ];
    }

    // Filtro por estado
    if (status) {
      filtro.status = status;
    }

    // Filtro por tipo de donación
    if (tipoDonacion) {
      if (!CONFIG_MUSEO.DONACIONES.TIPOS.includes(tipoDonacion)) {
        return res.status(400).json({ 
          msg: `Tipo inválido. Tipos permitidos: ${CONFIG_MUSEO.DONACIONES.TIPOS.join(', ')}` 
        });
      }
      filtro.tipoDonacion = tipoDonacion;
    }

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      filtro.fecha = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const donaciones = await Donacion.find(filtro)
      .select("-stripePaymentId")
      .sort({ fecha: -1 });

    // Calcular estadisticas
    const totalDonacionesEconomicas = donaciones.filter(d => 
      d.tipoDonacion === 'economica' && d.status === 'completada'
    ).length;

    const totalDonado = donaciones
      .filter(d => d.tipoDonacion === 'economica' && d.status === 'completada')
      .reduce((sum, donacion) => sum + donacion.monto, 0);

    const totalDonacionesBienes = donaciones.filter(d => 
      d.tipoDonacion === 'bienes'
    ).length;

    const bienesAceptados = donaciones.filter(d => 
      d.tipoDonacion === 'bienes' && d.status === 'aceptada'
    ).length;

    res.status(200).json({
      total: donaciones.length,
      estadisticas: {
        economicas: {
          total: totalDonacionesEconomicas,
          montoTotal: totalDonado
        },
        bienes: {
          total: totalDonacionesBienes,
          aceptados: bienesAceptados,
          pendientes: donaciones.filter(d => 
            d.tipoDonacion === 'bienes' && d.status === 'pendiente'
          ).length
        }
      },
      donaciones: donaciones.map(d => ({
        id: d._id,
        nombreDonante: d.nombreDonante,
        institucion: d.institucion,
        tipoDonacion: d.tipoDonacion,
        ...(d.tipoDonacion === 'economica' ? {
          monto: d.monto
        } : {
          descripcionBien: d.descripcionBien,
          estadoBien: d.estadoBien,
          fotoBien: d.fotoBien
        }),
        descripcion: d.descripcion,
        status: d.status,
        fecha: d.fecha,
        createdAt: d.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al obtener donaciones", 
      error: error.message 
    });
  }
};

// Obtener donación por ID
const obtenerDonacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const donacion = await Donacion.findById(id).select("-stripePaymentId");

    if (!donacion) {
      return res.status(404).json({ msg: "Donación no encontrada" });
    }

    const respuesta = {
      id: donacion._id,
      nombreDonante: donacion.nombreDonante,
      institucion: donacion.institucion,
      tipoDonacion: donacion.tipoDonacion,
      descripcion: donacion.descripcion,
      status: donacion.status,
      fecha: donacion.fecha,
      createdAt: donacion.createdAt,
      updatedAt: donacion.updatedAt
    };

    if (donacion.tipoDonacion === 'economica') {
      respuesta.monto = donacion.monto;
    } else {
      respuesta.descripcionBien = donacion.descripcionBien;
      respuesta.estadoBien = donacion.estadoBien;
      respuesta.fotoBien = donacion.fotoBien;
    }

    res.status(200).json(respuesta);
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al obtener donación", 
      error: error.message 
    });
  }
};

// Obtener estadísticas de donaciones
const obtenerEstadisticasDonaciones = async (req, res) => {
  try {
    // Donaciones economicas completadas
    const totalDonacionesEconomicas = await Donacion.countDocuments({ 
      tipoDonacion: 'economica',
      status: 'completada' 
    });

    const totalRecaudado = await Donacion.aggregate([
      { 
        $match: { 
          tipoDonacion: 'economica',
          status: 'completada' 
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$monto" }
        }
      }
    ]);

    // Donaciones de bienes
    const totalDonacionesBienes = await Donacion.countDocuments({ 
      tipoDonacion: 'bienes'
    });

    const bienesAceptados = await Donacion.countDocuments({ 
      tipoDonacion: 'bienes',
      status: 'aceptada' 
    });

    const bienesPendientes = await Donacion.countDocuments({ 
      tipoDonacion: 'bienes',
      status: 'pendiente' 
    });

    // Donaciones del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const donacionesMesActual = await Donacion.countDocuments({
      fecha: { $gte: inicioMes }
    });

    const recaudadoMesActual = await Donacion.aggregate([
      {
        $match: {
          fecha: { $gte: inicioMes },
          tipoDonacion: 'economica',
          status: 'completada'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$monto" }
        }
      }
    ]);

    // Donaciones por institución
    const donacionesPorInstitucion = await Donacion.aggregate([
      {
        $group: {
          _id: "$institucion",
          totalDonaciones: { $sum: 1 },
          montoTotal: { 
            $sum: { 
              $cond: [
                { $eq: ["$tipoDonacion", "economica"] },
                "$monto",
                0
              ]
            }
          }
        }
      },
      { $sort: { totalDonaciones: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      economicas: {
        totalDonaciones: totalDonacionesEconomicas,
        totalRecaudado: totalRecaudado[0]?.total || 0,
        recaudadoMesActual: recaudadoMesActual[0]?.total || 0
      },
      bienes: {
        total: totalDonacionesBienes,
        aceptados: bienesAceptados,
        pendientes: bienesPendientes
      },
      general: {
        donacionesMesActual,
        donacionesPorInstitucion
      }
    });
  } catch (error) {
    res.status(500).json({ 
      msg: "Error al obtener estadísticas", 
      error: error.message 
    });
  }
};

export {
  crearDonacionEconomica,
  crearSesionPagoStripe,
  webhookStripe,
  verificarEstadoPago,
  crearDonacionBienes,
  actualizarEstadoDonacionBienes,
  obtenerDonaciones,
  obtenerDonacionPorId,
  obtenerEstadisticasDonaciones
};