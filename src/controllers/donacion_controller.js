import Donacion from "../models/Donacion.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ==================== DONACIONES ====================

// Crear registro de donación (Usuario público - antes del pago)
const crearDonacion = async (req, res) => {
  try {
    const { nombreDonante, institucion, monto } = req.body;

    // Validaciones
    if (!nombreDonante || !institucion || !monto) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    if (monto <= 0) {
      return res.status(400).json({ msg: "El monto debe ser mayor a 0" });
    }

    const nuevaDonacion = new Donacion({
      nombreDonante,
      institucion,
      monto,
      status: "pendiente"
    });

    await nuevaDonacion.save();

    res.status(201).json({
      msg: "Registro de donación creado. Procede al pago",
      donacion: {
        id: nuevaDonacion._id,
        nombreDonante: nuevaDonacion.nombreDonante,
        institucion: nuevaDonacion.institucion,
        monto: nuevaDonacion.monto,
        fecha: nuevaDonacion.fecha,
        status: nuevaDonacion.status
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear donación", error: error.message });
  }
};

// Crear sesión de pago con Stripe
const crearSesionPagoStripe = async (req, res) => {
  try {
    const { donacionId } = req.body;

    const donacion = await Donacion.findById(donacionId);
    if (!donacion) {
      return res.status(404).json({ msg: "Donación no encontrada" });
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
            unit_amount: Math.round(donacion.monto * 100), // Stripe maneja centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.URL_FRONTEND}/donacion/exitosa?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL_FRONTEND}/donacion/cancelada`,
      metadata: {
        donacionId: donacion._id.toString(),
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
    res.status(500).json({ msg: "Error al crear sesión de pago", error: error.message });
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
    if (donacion) {
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
      donacion: donacion || null
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al verificar estado de pago", error: error.message });
  }
};

// Obtener todas las donaciones (Solo lectura para admin/admini/pasante)
const obtenerDonaciones = async (req, res) => {
  try {
    const { search, status, fechaInicio, fechaFin } = req.query;
    let filtro = {};

    // Filtro por búsqueda
    if (search) {
      const regex = new RegExp(search, "i");
      filtro = {
        $or: [
          { nombreDonante: regex },
          { institucion: regex }
        ]
      };
    }

    // Filtro por estado
    if (status) {
      filtro.status = status;
    }

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      filtro.fecha = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const donaciones = await Donacion.find(filtro)
      .select("nombreDonante institucion monto fecha status")
      .sort({ fecha: -1 });

    // Calcular total donado
    const totalDonado = donaciones
      .filter(d => d.status === "completada")
      .reduce((sum, donacion) => sum + donacion.monto, 0);

    res.status(200).json({
      total: donaciones.length,
      totalDonado,
      donaciones
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener donaciones", error: error.message });
  }
};

// Obtener donación por ID
const obtenerDonacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const donacion = await Donacion.findById(id);

    if (!donacion) {
      return res.status(404).json({ msg: "Donación no encontrada" });
    }

    res.status(200).json(donacion);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener donación", error: error.message });
  }
};

// Obtener estadísticas de donaciones
const obtenerEstadisticasDonaciones = async (req, res) => {
  try {
    const totalDonaciones = await Donacion.countDocuments({ status: "completada" });

    // Total recaudado
    const totalRecaudado = await Donacion.aggregate([
      { $match: { status: "completada" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$monto" }
        }
      }
    ]);

    // Donaciones del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const donacionesMesActual = await Donacion.countDocuments({
      fecha: { $gte: inicioMes },
      status: "completada"
    });

    const recaudadoMesActual = await Donacion.aggregate([
      {
        $match: {
          fecha: { $gte: inicioMes },
          status: "completada"
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
      { $match: { status: "completada" } },
      {
        $group: {
          _id: "$institucion",
          totalDonaciones: { $sum: 1 },
          montoTotal: { $sum: "$monto" }
        }
      },
      { $sort: { montoTotal: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      totalDonaciones,
      totalRecaudado: totalRecaudado[0]?.total || 0,
      donacionesMesActual,
      recaudadoMesActual: recaudadoMesActual[0]?.total || 0,
      donacionesPorInstitucion
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener estadísticas", error: error.message });
  }
};

export {
  crearDonacion,
  crearSesionPagoStripe,
  webhookStripe,
  verificarEstadoPago,
  obtenerDonaciones,
  obtenerDonacionPorId,
  obtenerEstadisticasDonaciones
};