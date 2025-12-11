import { jest } from '@jest/globals';

// Mock del modelo Visitante
let mockSave;
const mockVisitante = function(data) {
  Object.assign(this, {
    _id: '123',
    ...data,
    save: mockSave
  });
  return this;
};

jest.unstable_mockModule('../../../src/models/Visitante.js', () => ({
  default: mockVisitante
}));

const { crearVisitante } = await import('../../../src/controllers/visitante_controller.js');

describe('POST /api/visitante - Crear Visitante', () => {
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
    req.body = { nombre: 'Juan' };

    await crearVisitante(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Todos los campos son obligatorios'
    });
  });

  test('Debería crear el visitante correctamente', async () => {
    req.body = {
      nombre: 'Juan Pérez',
      cedula: '1234567890',
      institucion: 'PUCE'
    };

    await crearVisitante(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visitante registrado correctamente',
      visitante: expect.objectContaining({
        nombre: 'Juan Pérez',
        cedula: '1234567890',
        institucion: 'PUCE'
      })
    });
  });

  test('Debería usar fecha personalizada si se envía', async () => {
    const fechaCustom = new Date('2025-12-01');
    req.body = {
      nombre: 'María González',
      cedula: '0987654321',
      institucion: 'UCE',
      fecha: fechaCustom
    };

    await crearVisitante(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Debería usar fecha actual por defecto si no se envía', async () => {
    req.body = {
      nombre: 'Carlos Ruiz',
      cedula: '1122334455',
      institucion: 'EPN'
    };

    await crearVisitante(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Debería retornar 500 si hay error al crear', async () => {
    req.body = {
      nombre: 'Test',
      cedula: '1234567890',
      institucion: 'Test'
    };

    mockSave.mockRejectedValue(new Error('DB Error'));

    await crearVisitante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al crear visitante',
      error: 'DB Error'
    });
  });
});
