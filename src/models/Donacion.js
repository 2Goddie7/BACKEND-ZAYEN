import { Schema, model } from 'mongoose';

const donacionSchema = new Schema({
  monto: Number,
  moneda: { type: String, default: 'usd' },
  email: String,
  status: { type: String, enum: ['pendiente', 'completada', 'fallida'], default: 'pendiente' },
  stripeId: String
}, { timestamps: true })

export default model('Donacion', donacionSchema);