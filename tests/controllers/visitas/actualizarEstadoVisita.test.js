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

const { actualizarEstadoVisita } = await import('../../../src/controllers/visita_controller.js');
const visitasUtils = await import('../../../src/utils/visitas.utils.js');
const Visita = (await import('../../../src/models/Visita.js')).default;
const { CONFIG_MUSEO } = await import('../../../src/config/museo.config.js');

describe('PATCH /api/visita/:id/estado - Actualizar Estado Visita', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    Visita.findById = jest.fn();
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');
  });

  test('Debería retornar 400 si falta el campo status', async () => {
    req.params.id = '123';
    req.body = {};

    await actualizarEstadoVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'El estado es requerido',
      estadosPermitidos: CONFIG_MUSEO.VISITAS.ESTADOS
    });
  });

  test('Debería retornar 404 si la visita no existe', async () => {
    req.params.id = 'id-inexistente';
    req.body.status = 'realizada';
    Visita.findById.mockResolvedValue(null);

    await actualizarEstadoVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visita no encontrada'
    });
  });

  test('Debería actualizar el estado a "realizada" con descripción', async () => {
    req.params.id = '123';
    req.body = {
      status: 'realizada',
      descripcion: 'Visita exitosa'
    };

    const mockVisita = {
      _id: '123',
      institucion: 'PUCE',
      cantidadPersonas: 20,
      fechaVisita: new Date('2025-12-20'),
      horaBloque: '09:00',
      status: 'pendiente',
      descripcion: '',
      save: jest.fn().mockResolvedValue(true)
    };
    Visita.findById.mockResolvedValue(mockVisita);

    await actualizarEstadoVisita(req, res);

    expect(mockVisita.status).toBe('realizada');
    expect(mockVisita.descripcion).toBe('Visita exitosa');
    expect(mockVisita.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visita marcada como realizada',
      visita: expect.objectContaining({
        id: '123',
        status: 'realizada',
        descripcion: 'Visita exitosa'
      })
    });
  });

  test('Debería usar descripción default si se marca como realizada sin descripción', async () => {
    req.params.id = '456';
    req.body = { status: 'realizada' };

    const mockVisita = {
      _id: '456',
      institucion: 'UCE',
      cantidadPersonas: 15,
      fechaVisita: new Date('2025-12-21'),
      horaBloque: '10:00',
      status: 'pendiente',
      descripcion: '',
      save: jest.fn().mockResolvedValue(true)
    };
    Visita.findById.mockResolvedValue(mockVisita);

    await actualizarEstadoVisita(req, res);

    expect(mockVisita.descripcion).toBe(CONFIG_MUSEO.VISITAS.DESCRIPCION_DEFAULT_REALIZADA);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visita marcada como realizada',
      visita: expect.any(Object)
    });
  });

  test('Debería actualizar el estado a "cancelada"', async () => {
    req.params.id = '789';
    req.body = { 
      status: 'cancelada',
      descripcion: 'Motivo de cancelación'
    };

    const mockVisita = {
      _id: '789',
      institucion: 'ESPE',
      cantidadPersonas: 10,
      fechaVisita: new Date('2025-12-22'),
      horaBloque: '11:00',
      status: 'pendiente',
      descripcion: '',
      save: jest.fn().mockResolvedValue(true)
    };
    Visita.findById.mockResolvedValue(mockVisita);

    await actualizarEstadoVisita(req, res);

    expect(mockVisita.status).toBe('cancelada');
    expect(mockVisita.descripcion).toBe('Motivo de cancelación');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visita marcada como cancelada',
      visita: expect.any(Object)
    });
  });

  test('Debería retornar 500 si hay error', async () => {
    req.params.id = 'abc';
    req.body.status = 'realizada';
    Visita.findById.mockRejectedValue(new Error('DB Error'));

    await actualizarEstadoVisita(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al actualizar estado',
      error: 'DB Error'
    });
  });
});
