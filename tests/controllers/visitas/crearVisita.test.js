import { jest } from '@jest/globals';

// Mock del modelo Visita
let mockSave;
const mockVisita = function(data) {
  Object.assign(this, {
    _id: '123',
    ...data,
    save: mockSave
  });
  return this;
};

jest.unstable_mockModule('../../../src/models/Visita.js', () => ({
  default: mockVisita
}));
jest.unstable_mockModule('../../../src/utils/visitas.utils.js', () => ({
  validarFechaHoraVisita: jest.fn(),
  validarDisponibilidad: jest.fn(),
  generarBloqueId: jest.fn(),
  formatearFecha: jest.fn(),
  calcularDisponibilidadBloque: jest.fn(),
  esDiaHabil: jest.fn(),
  obtenerNombreDia: jest.fn()
}));

const { crearVisita } = await import('../../../src/controllers/visita_controller.js');
const visitasUtils = await import('../../../src/utils/visitas.utils.js');
const Visita = (await import('../../../src/models/Visita.js')).default;

describe('POST /api/visita - Crear Visita', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockSave = jest.fn().mockResolvedValue(true);
    jest.clearAllMocks();
  });

  test('Debería retornar 400 si faltan campos requeridos', async () => {
    req.body = { institucion: 'PUCE' };

    await crearVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Todos los campos son obligatorios',
      camposRequeridos: ['institucion', 'cantidadPersonas', 'fechaVisita', 'horaBloque']
    });
  });

  test('Debería retornar 400 si la fecha u hora no son válidas', async () => {
    req.body = {
      institucion: 'PUCE',
      cantidadPersonas: 20,
      fechaVisita: '2025-01-01',
      horaBloque: '18:00'
    };

    visitasUtils.validarFechaHoraVisita.mockReturnValue({
      valido: false,
      mensaje: 'Horario no permitido'
    });

    await crearVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Horario no permitido'
      })
    );
  });

  test('Debería retornar 400 si el bloque excede la capacidad', async () => {
    req.body = {
      institucion: 'UCE',
      cantidadPersonas: 30,
      fechaVisita: '2025-12-15',
      horaBloque: '10:00'
    };

    visitasUtils.validarFechaHoraVisita.mockReturnValue({
      valido: true,
      mensaje: 'Válido'
    });
    visitasUtils.generarBloqueId.mockReturnValue('2025-12-15_10:00');

    Visita.validarCapacidadBloque = jest.fn().mockResolvedValue({
      permitido: false,
      personasActuales: 25,
      capacidadMaxima: 40,
      disponibles: 15
    });

    await crearVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('completo')
      })
    );
  });

  test('Debería crear la visita correctamente', async () => {
    req.body = {
      institucion: 'PUCE',
      cantidadPersonas: 25,
      fechaVisita: '2025-12-20',
      horaBloque: '09:00',
      descripcion: 'Visita de estudiantes'
    };

    visitasUtils.validarFechaHoraVisita.mockReturnValue({
      valido: true
    });
    visitasUtils.generarBloqueId.mockReturnValue('2025-12-20_09:00');
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');

    Visita.validarCapacidadBloque = jest.fn().mockResolvedValue({
      permitido: true,
      personasActuales: 10,
      capacidadMaxima: 40,
      disponibles: 30
    });

    await crearVisita(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visita registrada correctamente',
      visita: expect.objectContaining({
        institucion: 'PUCE',
        cantidadPersonas: 25
      }),
      capacidadBloque: expect.any(Object)
    });
  });

  test('Debería retornar 500 si hay error', async () => {
    req.body = {
      institucion: 'Test',
      cantidadPersonas: 20,
      fechaVisita: '2025-12-20',
      horaBloque: '10:00'
    };

    visitasUtils.validarFechaHoraVisita.mockReturnValue({
      valido: true
    });
    visitasUtils.generarBloqueId.mockReturnValue('2025-12-20_10:00');
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');

    Visita.validarCapacidadBloque = jest.fn().mockResolvedValue({
      permitido: true,
      personasActuales: 10,
      capacidadMaxima: 40,
      disponibles: 30
    });

    mockSave.mockRejectedValue(new Error('Test Error'));

    await crearVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al crear visita',
      error: 'Test Error'
    });
  });
});
