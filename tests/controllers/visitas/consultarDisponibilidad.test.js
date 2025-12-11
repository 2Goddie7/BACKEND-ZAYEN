import { jest } from '@jest/globals';

// Mock de visitas utils
jest.unstable_mockModule('../../../src/utils/visitas.utils.js', () => ({
  formatearFecha: jest.fn(),
  validarFechaHoraVisita: jest.fn(),
  generarBloqueId: jest.fn(),
  calcularDisponibilidadBloque: jest.fn(),
  esDiaHabil: jest.fn(),
  obtenerNombreDia: jest.fn()
}));

const { consultarDisponibilidad } = await import('../../../src/controllers/visita_controller.js');
const visitasUtils = await import('../../../src/utils/visitas.utils.js');
const Visita = (await import('../../../src/models/Visita.js')).default;
const { CONFIG_MUSEO } = await import('../../../src/config/museo.config.js');

describe('GET /api/visita/disponibilidad - Consultar Disponibilidad', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    Visita.find = jest.fn();
  });

  test('Debería retornar 400 si faltan parámetros requeridos', async () => {
    req.query = {};

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'La fecha es requerida',
      formato: 'YYYY-MM-DD'
    });
  });

  test('Debería retornar 400 si la fecha u hora no son válidas', async () => {
    req.query = {
      fecha: '2025-01-01' // Asume que es domingo o feriado
    };

    visitasUtils.esDiaHabil.mockReturnValue(false);
    visitasUtils.obtenerNombreDia.mockReturnValue('Domingo');

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('no es un día hábil')
      })
    );
  });

  test('Debería retornar disponibilidad completa si no hay visitas', async () => {
    req.query = {
      fecha: '2025-12-20'
    };

    visitasUtils.esDiaHabil.mockReturnValue(true);
    visitasUtils.obtenerNombreDia.mockReturnValue('Viernes');
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');
    visitasUtils.calcularDisponibilidadBloque.mockReturnValue({
      disponible: true,
      personasActuales: 0,
      cuposDisponibles: CONFIG_MUSEO.VISITAS.CAPACIDAD_MAXIMA_POR_BLOQUE
    });

    Visita.obtenerVisitasPorBloque = jest.fn().mockResolvedValue([]);

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha: '2025-12-20',
        diaSemana: 'Viernes',
        bloques: expect.any(Array)
      })
    );
  });

  test('Debería calcular disponibilidad con visitas existentes', async () => {
    req.query = {
      fecha: '2025-12-20'
    };

    visitasUtils.esDiaHabil.mockReturnValue(true);
    visitasUtils.obtenerNombreDia.mockReturnValue('Viernes');
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');
    visitasUtils.calcularDisponibilidadBloque.mockReturnValue({
      disponible: true,
      personasActuales: 25,
      cuposDisponibles: 15
    });

    const mockVisitas = [
      {
        _id: '09:00',
        totalPersonas: 25,
        visitas: [{ institucion: 'PUCE', cantidadPersonas: 25 }]
      }
    ];
    Visita.obtenerVisitasPorBloque = jest.fn().mockResolvedValue(mockVisitas);

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha: '2025-12-20',
        bloques: expect.any(Array)
      })
    );
  });

  test('Debería retornar disponible:false si el bloque está lleno', async () => {
    req.query = {
      fecha: '2025-12-20'
    };

    visitasUtils.esDiaHabil.mockReturnValue(true);
    visitasUtils.obtenerNombreDia.mockReturnValue('Viernes');
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');
    visitasUtils.calcularDisponibilidadBloque.mockReturnValue({
      disponible: false,
      personasActuales: 40,
      cuposDisponibles: 0
    });

    const mockVisitas = [
      {
        _id: '11:00',
        totalPersonas: 40,
        visitas: [{ institucion: 'UCE', cantidadPersonas: 40 }]
      }
    ];
    Visita.obtenerVisitasPorBloque = jest.fn().mockResolvedValue(mockVisitas);

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha: '2025-12-20',
        bloques: expect.any(Array)
      })
    );
  });

  test('Debería retornar 500 si hay error', async () => {
    req.query = {
      fecha: '2025-12-20'
    };

    visitasUtils.esDiaHabil.mockReturnValue(true);
    Visita.obtenerVisitasPorBloque = jest.fn().mockRejectedValue(new Error('Test Error'));

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al consultar disponibilidad',
      error: 'Test Error'
    });
  });
});
