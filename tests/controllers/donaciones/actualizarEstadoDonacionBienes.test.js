import { jest } from '@jest/globals';
import { actualizarEstadoDonacionBienes } from '../../../src/controllers/donacion_controller.js';
import Donacion from '../../../src/models/Donacion.js';

// Mocks
jest.mock('../../../src/models/Donacion.js');

describe('PATCH /api/donacion/:id/estado-bien - Actualizar Estado Donación Bienes', () => {
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
    Donacion.findById = jest.fn();
  });

  test('Debería retornar 400 si falta el campo status', async () => {
    req.params.id = '123';
    req.body = {};

    await actualizarEstadoDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('inválido')
      })
    );
  });

  test('Debería retornar 404 si la donación no existe', async () => {
    req.params.id = 'id-inexistente';
    req.body.status = 'aceptada';
    Donacion.findById.mockResolvedValue(null);

    await actualizarEstadoDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Donación no encontrada'
    });
  });

  test('Debería retornar 400 si la donación no es de tipo bienes', async () => {
    req.params.id = '123';
    req.body.status = 'aceptada';
    const mockDonacion = {
      _id: '123',
      tipoDonacion: 'economica'
    };
    Donacion.findById.mockResolvedValue(mockDonacion);

    await actualizarEstadoDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Esta acción solo aplica a donaciones de bienes'
    });
  });

  test('Debería actualizar el estado a "aceptada" correctamente', async () => {
    req.params.id = '456';
    req.body.status = 'aceptada';
    const mockDonacion = {
      _id: '456',
      tipoDonacion: 'bienes',
      status: 'pendiente',
      nombreDonante: 'Juan Pérez',
      institucion: 'PUCE',
      descripcionBien: 'Microscopio',
      estadoBien: 'usado',
      fecha: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };
    Donacion.findById.mockResolvedValue(mockDonacion);

    await actualizarEstadoDonacionBienes(req, res);

    expect(mockDonacion.status).toBe('aceptada');
    expect(mockDonacion.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Donación de bienes aceptada correctamente',
      donacion: expect.objectContaining({
        id: '456',
        status: 'aceptada'
      })
    });
  });

  test('Debería actualizar el estado a "no_aceptada" correctamente', async () => {
    req.params.id = '789';
    req.body.status = 'no_aceptada';
    const mockDonacion = {
      _id: '789',
      tipoDonacion: 'bienes',
      status: 'pendiente',
      nombreDonante: 'Maria',
      institucion: 'UCE',
      descripcionBien: 'Libro',
      estadoBien: 'nuevo',
      fecha: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };
    Donacion.findById.mockResolvedValue(mockDonacion);

    await actualizarEstadoDonacionBienes(req, res);

    expect(mockDonacion.status).toBe('no_aceptada');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Donación de bienes rechazada correctamente',
      donacion: expect.any(Object)
    });
  });

  test('Debería retornar 500 si hay error', async () => {
    req.params.id = 'abc';
    req.body.status = 'aceptada';
    Donacion.findById.mockRejectedValue(new Error('DB Error'));

    await actualizarEstadoDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al actualizar estado de donación',
      error: 'DB Error'
    });
  });
});
