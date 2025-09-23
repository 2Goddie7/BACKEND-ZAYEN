import { Schema, model } from 'mongoose'

const exposicionSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  imagen: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  audio: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  creadoPor: {
    _id: { type: Schema.Types.ObjectId, required: true },
    rol: { type: String, enum: ['administrador', 'admini', 'pasante'], required: true }
  },
  codigoQR: {
    type: String,
    unique: true,
    required: true
  },
  publica: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default model('Exposicion', exposicionSchema)
