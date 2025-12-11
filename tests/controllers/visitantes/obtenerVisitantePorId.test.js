import { jest } from '@jest/globals';
import { obtenerVisitantePorId } from '../../../src/controllers/visitante_controller.js';
import Visitante from '../../../src/models/Visitante.js';

// Mocks
jest.mock('../../../src/models/Visitante.js');

describe('GET /api/visitante/:id - Obtener Visitante Por ID', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    Visitante.findById = jest.fn();
  });

  test('Debería retornar 404 si el visitante no existe', async () => {
    req.params.id = 'id-inexistente';
    Visitante.findById.mockResolvedValue(null);

    await obtenerVisitantePorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visitante no encontrado'
    });
  });

  test('Debería retornar 200 con el visitante encontrado', async () => {
    req.params.id = '123';
    const mockVisitante = {
      _id: '123',
      nombre: 'Juan Pérez',
      cedula: '1234567890',
      institucion: 'PUCE',
      fecha: new Date()
    };

    Visitante.findById.mockResolvedValue(mockVisitante);

    await obtenerVisitantePorId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockVisitante);
  });

  test('Debería retornar 500 si hay error', async () => {
    req.params.id = '789';
    Visitante.findById.mockRejectedValue(new Error('DB Error'));

    await obtenerVisitantePorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener visitante',
      error: 'DB Error'
    });
  });
});
