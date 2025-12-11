import { jest } from '@jest/globals';
import { eliminarVisitante } from '../../../src/controllers/visitante_controller.js';
import Visitante from '../../../src/models/Visitante.js';

// Mocks
jest.mock('../../../src/models/Visitante.js');

describe('DELETE /api/visitante/:id - Eliminar Visitante', () => {
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

    await eliminarVisitante(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visitante no encontrado'
    });
  });

  test('Debería eliminar el visitante correctamente', async () => {
    req.params.id = '123';
    const mockVisitante = {
      _id: '123',
      nombre: 'Juan Pérez',
      deleteOne: jest.fn().mockResolvedValue(true)
    };

    Visitante.findById.mockResolvedValue(mockVisitante);

    await eliminarVisitante(req, res);

    expect(mockVisitante.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visitante eliminado correctamente'
    });
  });

  test('Debería retornar 500 si hay error al eliminar', async () => {
    req.params.id = '789';
    Visitante.findById.mockRejectedValue(new Error('DB Error'));

    await eliminarVisitante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al eliminar visitante',
      error: 'DB Error'
    });
  });
});
