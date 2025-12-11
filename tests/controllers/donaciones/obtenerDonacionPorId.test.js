import { jest } from '@jest/globals';
import { obtenerDonacionPorId } from '../../../src/controllers/donacion_controller.js';
import Donacion from '../../../src/models/Donacion.js';

// Mocks
jest.mock('../../../src/models/Donacion.js');

describe('GET /api/donacion/:id - Obtener Donación Por ID', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    Donacion.findById = jest.fn();
  });

  test('Debería retornar 404 si la donación no existe', async () => {
    req.params.id = 'id-inexistente';
    Donacion.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await obtenerDonacionPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Donación no encontrada'
    });
  });

  test('Debería retornar 200 con la donación económica encontrada', async () => {
    req.params.id = '123';
    const mockDonacion = {
      _id: '123',
      nombreDonante: 'Juan Pérez',
      institucion: 'PUCE',
      tipoDonacion: 'economica',
      monto: 150,
      descripcion: 'Donación',
      status: 'completada',
      fecha: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Donacion.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockDonacion)
    });

    await obtenerDonacionPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '123',
        nombreDonante: 'Juan Pérez',
        tipoDonacion: 'economica',
        monto: 150
      })
    );
  });

  test('Debería retornar 200 con la donación de bienes encontrada', async () => {
    req.params.id = '456';
    const mockDonacion = {
      _id: '456',
      nombreDonante: 'María López',
      institucion: 'UCE',
      tipoDonacion: 'bienes',
      descripcionBien: 'Microscopio',
      estadoBien: 'usado',
      fotoBien: 'uploads/foto.jpg',
      status: 'aceptada',
      fecha: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Donacion.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockDonacion)
    });

    await obtenerDonacionPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '456',
        tipoDonacion: 'bienes',
        estadoBien: 'usado'
      })
    );
  });

});
