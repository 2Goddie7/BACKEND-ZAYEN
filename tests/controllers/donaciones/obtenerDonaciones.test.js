import { jest } from '@jest/globals';
import { obtenerDonaciones } from '../../../src/controllers/donacion_controller.js';
import Donacion from '../../../src/models/Donacion.js';

// Mocks
jest.mock('../../../src/models/Donacion.js');

describe('GET /api/donacion - Obtener Donaciones', () => {
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
    Donacion.find = jest.fn();
  });

  test('Debería retornar todas las donaciones sin filtros', async () => {
    const mockDonaciones = [
      {
        _id: '1',
        nombreDonante: 'Juan',
        institucion: 'PUCE',
        tipoDonacion: 'economica',
        monto: 100,
        status: 'completada',
        fecha: new Date(),
        createdAt: new Date()
      },
      {
        _id: '2',
        nombreDonante: 'María',
        institucion: 'UCE',
        tipoDonacion: 'bienes',
        descripcionBien: 'Libro',
        estadoBien: 'usado',
        status: 'pendiente',
        fecha: new Date(),
        createdAt: new Date()
      }
    ];

    Donacion.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDonaciones)
      })
    });

    await obtenerDonaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 2,
        donaciones: expect.any(Array),
        estadisticas: expect.any(Object)
      })
    );
  });

  test('Debería filtrar donaciones por tipoDonacion', async () => {
    req.query.tipoDonacion = 'economica';

    const mockDonaciones = [
      {
        _id: '1',
        nombreDonante: 'Juan',
        institucion: 'PUCE',
        tipoDonacion: 'economica',
        monto: 100,
        status: 'completada',
        fecha: new Date(),
        createdAt: new Date()
      }
    ];

    Donacion.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDonaciones)
      })
    });

    await obtenerDonaciones(req, res);

    expect(Donacion.find).toHaveBeenCalledWith(
      expect.objectContaining({ tipoDonacion: 'economica' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Debería filtrar donaciones por status', async () => {
    req.query.status = 'pendiente';

    Donacion.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      })
    });

    await obtenerDonaciones(req, res);

    expect(Donacion.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pendiente' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Debería buscar por nombreDonante', async () => {
    req.query.search = 'Juan';

    Donacion.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      })
    });

    await obtenerDonaciones(req, res);

    expect(Donacion.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          expect.objectContaining({ nombreDonante: expect.any(RegExp) }),
          expect.objectContaining({ institucion: expect.any(RegExp) })
        ])
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Debería retornar 500 si hay error', async () => {
    Donacion.find = jest.fn().mockImplementation(() => {
      throw new Error('DB Error');
    });

    await obtenerDonaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener donaciones',
      error: 'DB Error'
    });
  });
});
