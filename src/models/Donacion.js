import { Schema, model } from 'mongoose';

const donacionSchema = new Schema({
    nombreDonante: {
        type: String,
        required: true,
        trim: true
    },
    institucion: {
        type: String,
        required: true,
        trim: true
    },
    monto: {
        type: Number,
        required: true,
        min: 0
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    stripePaymentId: { // esto campo es útil para stripe 
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pendiente', 'completada', 'fallida'],
        default: 'pendiente'
    }
}, {
    timestamps: true,
    collection: 'donacion'
});

export default model('Donacion', donacionSchema);