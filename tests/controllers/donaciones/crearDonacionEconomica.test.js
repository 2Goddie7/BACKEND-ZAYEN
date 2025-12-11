import { jest } from '@jest/globals';
import { CONFIG_MUSEO } from '../../../src/config/museo.config.js';

// Mock del modelo Donacion
let mockSave;
const mockDonacion = function(data) {
  Object.assign(this, {
    _id: '123',
    fecha: new Date(),
    ...data,
    save: mockSave
  });
  return this;
};

jest.unstable_mockModule('../../../src/models/Donacion.js', () => ({
  default: mockDonacion
}));

const { crearDonacionEconomica } = await import('../../../src/controllers/donacion_controller.js');

describe('POST /api/donacion/economica - Crear Donación Económica', () => {
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
    req.body = { nombreDonante: 'Juan' };

    await crearDonacionEconomica(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Todos los campos son obligatorios',
      camposRequeridos: ['nombreDonante', 'institucion', 'monto']
    });
  });

  test('Debería retornar 400 si el monto es 0 o negativo', async () => {
    req.body = {
      nombreDonante: 'Juan Pérez',
      institucion: 'PUCE',
      monto: -10
    };

    await crearDonacionEconomica(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'El monto debe ser mayor a 0'
    });
  });

  test('Debería retornar 201 y crear la donación económica correctamente', async () => {
    req.body = {
      nombreDonante: 'María González',
      institucion: 'PUCE',
      monto: 50,
      descripcion: 'Donación para museo'
    };

    await crearDonacionEconomica(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Donación económica registrada. Procede al pago',
      donacion: expect.objectContaining({
        nombreDonante: 'María González',
        tipoDonacion: 'economica',
        monto: 50
      })
    });
  });

  test('Debería usar descripción por defecto si no se envía', async () => {
    req.body = {
      nombreDonante: 'Carlos Ruiz',
      institucion: 'UCE',
      monto: 100
    };

    await crearDonacionEconomica(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        donacion: expect.objectContaining({
          descripcion: CONFIG_MUSEO.DONACIONES.DESCRIPCION_DEFAULT
        })
      })
    );
  });

  test('Debería retornar 500 si hay error al crear donación', async () => {
    req.body = {
      nombreDonante: 'Test',
      institucion: 'Test',
      monto: 50
    };

    mockSave.mockRejectedValue(new Error('DB Error'));

    await crearDonacionEconomica(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al crear donación económica',
      error: 'DB Error'
    });
  });
});
