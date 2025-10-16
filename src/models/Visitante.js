import { Schema, model } from 'mongoose';

const visitanteSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    cedula: {
        type: String,
        required: true,
        trim: true
    },
    institucion: {
        type: String,
        required: true,
        trim: true
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'visitante'
});

export default model('Visitante', visitanteSchema);