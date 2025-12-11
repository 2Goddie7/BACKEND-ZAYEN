import { jest } from '@jest/globals';
import { obtenerVisitantes } from '../../../src/controllers/visitante_controller.js';
import Visitante from '../../../src/models/Visitante.js';

// Mocks
jest.mock('../../../src/models/Visitante.js');

describe('GET /api/visitante - Obtener Visitantes', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // Mock Visitante methods
    Visitante.find = jest.fn();
    Visitante.countDocuments = jest.fn();
    jest.clearAllMocks();
  });

  test('Debería retornar todos los visitantes sin filtros', async () => {
    const mockVisitantes = [
      {
        _id: '1',
        nombre: 'Juan Pérez',
        cedula: '1234567890',
        institucion: 'PUCE',
        fecha: new Date()
      },
      {
        _id: '2',
        nombre: 'María López',
        cedula: '0987654321',
        institucion: 'UCE',
        fecha: new Date()
      }
    ];

    Visitante.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockVisitantes)
    });

    await obtenerVisitantes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      total: 2,
      visitantes: mockVisitantes
    });
  });

  test('Debería filtrar por búsqueda general (nombre, cedula, institucion)', async () => {
    req.query.search = 'Juan';

    Visitante.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitantes(req, res);

    expect(Visitante.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.any(Array)
      })
    );
  });

  test('Debería filtrar por institución específica', async () => {
    req.query.institucion = 'PUCE';

    Visitante.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitantes(req, res);

    expect(Visitante.find).toHaveBeenCalledWith(
      expect.objectContaining({
        institucion: expect.any(RegExp)
      })
    );
  });

  test('Debería filtrar por fecha', async () => {
    req.query.fecha = '2025-12-20';

    Visitante.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitantes(req, res);

    expect(Visitante.find).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha: expect.any(Object)
      })
    );
  });

  test('Debería retornar 500 si hay error', async () => {
    Visitante.find = jest.fn().mockImplementation(() => {
      throw new Error('DB Error');
    });

    await obtenerVisitantes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener visitantes',
      error: 'DB Error'
    });
  });
});
