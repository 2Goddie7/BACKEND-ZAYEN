import { Schema, model } from 'mongoose';
import { CONFIG_MUSEO } from '../config/museo.config.js';

const visitaSchema = new Schema({
    institucion: {
        type: String,
        required: [true, 'La institución es requerida'],
        trim: true,
        minlength: [3, 'El nombre de la institución debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre de la institución no debe exceder 100 caracteres']
    },
    cantidadPersonas: {
        type: Number,
        required: [true, 'La cantidad de personas es requerida'],
        min: [CONFIG_MUSEO.VISITAS.CANTIDAD_MINIMA_GRUPO, `Mínimo ${CONFIG_MUSEO.VISITAS.CANTIDAD_MINIMA_GRUPO} personas por visita`],
        max: [CONFIG_MUSEO.VISITAS.CANTIDAD_MAXIMA_GRUPO, `Máximo ${CONFIG_MUSEO.VISITAS.CANTIDAD_MAXIMA_GRUPO} personas por visita`]
    },
    fechaVisita: {
        type: Date,
        required: [true, 'La fecha de visita es requerida']
    },
    horaBloque: {
        type: String,
        required: [true, 'El bloque horario es requerido'],
        validate: {
            validator: function(v) {
                return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Formato de hora inválido (debe ser HH:MM)'
        }
    },
    bloqueId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: {
            values: CONFIG_MUSEO.VISITAS.ESTADOS,
            message: '{VALUE} no es un estado válido'
        },
        default: 'pendiente'
    },
    descripcion: {
        type: String,
        default: '',
        trim: true,
        maxlength: [500, 'La descripción no debe exceder 500 caracteres']
    }
}, {
    timestamps: true,
    collection: 'visita'
});

// Indice para busquedas por bloque
visitaSchema.index({ bloqueId: 1, status: 1 });

// Indice para busquedas por fecha
visitaSchema.index({ fechaVisita: 1, horaBloque: 1 });

// Middleware para en caso de no poner descripción establecer una por default
visitaSchema.pre('save', function(next) {
    if (this.status === 'realizada' && !this.descripcion) {
        this.descripcion = CONFIG_MUSEO.VISITAS.DESCRIPCION_DEFAULT_REALIZADA;
    }
    next();
});

// Método para validar si se puede agregar personas al bloque
visitaSchema.statics.validarCapacidadBloque = async function(bloqueId, nuevasPersonas, visitaIdExcluir = null) {
    const query = { bloqueId, status: { $ne: 'cancelada' } };
    
    // excluir la visita actual si la estamos actualizando
    if (visitaIdExcluir) {
        query._id = { $ne: visitaIdExcluir };
    }
    
    const visitasEnBloque = await this.find(query);
    const personasActuales = visitasEnBloque.reduce((sum, v) => sum + v.cantidadPersonas, 0);
    const totalConNuevas = personasActuales + nuevasPersonas;
    
    return {
        personasActuales,
        nuevasPersonas,
        totalConNuevas,
        capacidadMaxima: CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE,
        disponibles: CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE - personasActuales,
        permitido: totalConNuevas <= CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE
    };
};

// Método para obtener las visitas agrupadas por bloque
visitaSchema.statics.obtenerVisitasPorBloque = async function(fechaVisita) {
    const inicioDia = new Date(fechaVisita);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fechaVisita);
    finDia.setHours(23, 59, 59, 999);
    
    return await this.aggregate([
        {
            $match: {
                fechaVisita: { $gte: inicioDia, $lte: finDia },
                status: { $ne: 'cancelada' }
            }
        },
        {
            $group: {
                _id: '$horaBloque',
                totalPersonas: { $sum: '$cantidadPersonas' },
                visitas: { 
                    $push: { 
                        institucion: '$institucion', 
                        cantidadPersonas: '$cantidadPersonas',
                        descripcion: '$descripcion'
                    } 
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

export default model('Visita', visitaSchema);
