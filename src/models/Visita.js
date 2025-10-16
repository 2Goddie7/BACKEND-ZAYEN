import { Schema, model } from 'mongoose';

const visitaSchema = new Schema({
    institucion: {
        type: String,
        required: true,
        trim: true
    },
    cantidadPersonas: {
        type: Number,
        required: true,
        min: 1
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'visita'
});

export default model('Visita', visitaSchema);