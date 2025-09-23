import { Schema, model } from 'mongoose';

const pasanteSchema = new Schema({
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
    facultad: {
        type: String,
        required: true,
        trim: true
    },
    celular: {
        type: String,
        required: true,
        trim: true
    },
    fotoPerfil:{
        type:String
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
    },
    microsoftId: {
    type: String
  }
}, {
  timestamps: true
});


// Método para generar token
pasanteSchema.methods.crearToken = function () {
    const tokenGenerado = this.token = Math.random().toString(36).slice(2);
    return tokenGenerado;
};

export default model('Pasante', pasanteSchema);