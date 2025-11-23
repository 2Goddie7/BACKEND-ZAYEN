import { Schema, model } from 'mongoose';
import { CONFIG_MUSEO } from '../config/museo.config.js';

const donacionSchema = new Schema({
    // ==================== CAMPOS COMUNES ====================
    nombreDonante: {
        type: String,
        required: [true, 'El nombre del donante es requerido'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no debe exceder 100 caracteres']
    },
    institucion: {
        type: String,
        required: [true, 'La institución es requerida'],
        trim: true
    },
    tipoDonacion: {
        type: String,
        required: [true, 'El tipo de donación es requerido'],
        enum: {
            values: CONFIG_MUSEO.DONACIONES.TIPOS,
            message: '{VALUE} no es un tipo válido. Tipos permitidos: economica, bienes'
        }
    },
    descripcion: {
        type: String,
        default: CONFIG_MUSEO.DONACIONES.DESCRIPCION_DEFAULT,
        maxlength: [500, 'La descripción no debe exceder 500 caracteres']
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    
    // ==================== DONACIÓN ECONÓMICA ====================
    monto: {
        type: Number,
        min: [0.01, 'El monto debe ser mayor a 0'],
        required: function() {
            return this.tipoDonacion === 'economica';
        },
        validate: {
            validator: function(v) {
                // Si es tipo económica, monto es obligatorio
                if (this.tipoDonacion === 'economica') {
                    return v != null && v > 0;
                }
                return true;
            },
            message: 'El monto es requerido para donaciones económicas'
        }
    },
    stripePaymentId: {
        type: String,
        default: null
    },
    
    // ==================== DONACIÓN DE BIENES ====================
    descripcionBien: {
        type: String,
        trim: true,
        required: function() {
            return this.tipoDonacion === 'bienes';
        },
        minlength: [10, 'La descripción del bien debe tener al menos 10 caracteres'],
        maxlength: [500, 'La descripción del bien no debe exceder 500 caracteres']
    },
    estadoBien: {
        type: String,
        enum: {
            values: CONFIG_MUSEO.DONACIONES.ESTADOS_BIEN,
            message: '{VALUE} no es un estado válido. Estados permitidos: nuevo, usado'
        },
        required: function() {
            return this.tipoDonacion === 'bienes';
        }
    },
    fotoBien: {
        type: String,
        required: function() {
            return this.tipoDonacion === 'bienes';
        }
    },
    
    // ==================== ESTADO ====================
    status: {
        type: String,
        enum: {
            values: ['pendiente', 'completada', 'fallida', 'aceptada', 'no_aceptada'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'pendiente',
        validate: {
            validator: function(value) {
                // Validar estados según tipo de donación
                if (this.tipoDonacion === 'economica') {
                    return CONFIG_MUSEO.DONACIONES.ESTADOS_ECONOMICA.includes(value);
                } else if (this.tipoDonacion === 'bienes') {
                    return CONFIG_MUSEO.DONACIONES.ESTADOS_BIENES.includes(value);
                }
                return false;
            },
            message: function(props) {
                if (this.tipoDonacion === 'economica') {
                    return `Para donaciones económicas, estados válidos: ${CONFIG_MUSEO.DONACIONES.ESTADOS_ECONOMICA.join(', ')}`;
                }
                return `Para donaciones de bienes, estados válidos: ${CONFIG_MUSEO.DONACIONES.ESTADOS_BIENES.join(', ')}`;
            }
        }
    }
}, {
    timestamps: true,
    collection: 'donacion'
});

// Índices para optimizar consultas
donacionSchema.index({ tipoDonacion: 1, status: 1 });
donacionSchema.index({ fecha: -1 });
donacionSchema.index({ nombreDonante: 1, institucion: 1 });

// Validación pre-save
donacionSchema.pre('save', function(next) {
    // Para donaciones de bienes, asegurar que monto sea 0 o null
    if (this.tipoDonacion === 'bienes' && !this.monto) {
        this.monto = 0;
    }
    
    // Validar campos requeridos según tipo
    if (this.tipoDonacion === 'economica') {
        if (!this.monto || this.monto <= 0) {
            return next(new Error('El monto es requerido para donaciones económicas'));
        }
    }
    
    if (this.tipoDonacion === 'bienes') {
        if (!this.descripcionBien || !this.estadoBien || !this.fotoBien) {
            return next(new Error('Descripción, estado y foto son requeridos para donaciones de bienes'));
        }
    }
    
    next();
});

// Método estático para obtener estadísticas por tipo
donacionSchema.statics.obtenerEstadisticasPorTipo = async function(tipoDonacion) {
    const query = tipoDonacion ? { tipoDonacion } : {};
    
    if (tipoDonacion === 'economica') {
        query.status = 'completada';
    } else if (tipoDonacion === 'bienes') {
        query.status = 'aceptada';
    }
    
    const stats = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$tipoDonacion',
                total: { $sum: 1 },
                montoTotal: { $sum: '$monto' }
            }
        }
    ]);
    
    return stats;
};

// Virtual para obtener el tipo de donación formateado
donacionSchema.virtual('tipoDonacionFormateado').get(function() {
    return this.tipoDonacion === 'economica' ? 'Económica' : 'Bienes';
});

// Virtual para obtener el estado formateado
donacionSchema.virtual('estadoFormateado').get(function() {
    const estados = {
        pendiente: 'Pendiente',
        completada: 'Completada',
        fallida: 'Fallida',
        aceptada: 'Aceptada',
        no_aceptada: 'No Aceptada'
    };
    return estados[this.status] || this.status;
});

// Incluir virtuals en JSON y Object
donacionSchema.set('toJSON', { virtuals: true });
donacionSchema.set('toObject', { virtuals: true });

export default model('Donacion', donacionSchema);