import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const administradorSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['administrador', 'admini'],
    default: 'administrador'
  },
  celular: {
    type: String,
    required: true,
    trim: true
  },
  fotoPerfil: {
    type: String,
    default: null
  },
  token: {
    type: String,
    default: null
  },
  confirmEmail: {
    type: Boolean,
    default: false
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'administrador'
});

// Cifrar la contraseña
administradorSchema.methods.encrypPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Verificar contraseña
administradorSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Generar token
administradorSchema.methods.crearToken = function () {
  const tokenGenerado = this.token = Math.random().toString(36).slice(2);
  return tokenGenerado;
};

export default model('Administrador', administradorSchema);