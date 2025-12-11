import { jest } from '@jest/globals';

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

const { crearDonacionBienes } = await import('../../../src/controllers/donacion_controller.js');

describe('POST /api/donacion/bienes - Crear Donación de Bienes', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      file: null
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
    req.file = { path: 'uploads/foto.jpg' };

    await crearDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.any(String)
      })
    );
  });

  test('Debería retornar 400 si no se sube foto del bien', async () => {
    req.body = {
      nombreDonante: 'Juan Pérez',
      institucion: 'PUCE',
      descripcionBien: 'Libro antiguo de biología',
      estadoBien: 'usado'
    };
    req.file = null;

    await crearDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'La foto del bien es requerida'
    });
  });

  test('Debería retornar 201 y crear la donación de bienes correctamente', async () => {
    req.body = {
      nombreDonante: 'María González',
      institucion: 'UCE',
      descripcionBien: 'Microscopio antiguo en buen estado',
      estadoBien: 'usado',
      descripcion: 'Donación importante'
    };
    req.file = { path: 'uploads/microscopio.jpg' };

    await crearDonacionBienes(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Donación de bienes registrada correctamente. Será revisada por el equipo del museo',
      donacion: expect.objectContaining({
        nombreDonante: 'María González',
        tipoDonacion: 'bienes',
        estadoBien: 'usado'
      })
    });
  });

  test('Debería aceptar estadoBien "nuevo"', async () => {
    req.body = {
      nombreDonante: 'Pedro López',
      institucion: 'EPN',
      descripcionBien: 'Equipo de laboratorio nuevo',
      estadoBien: 'nuevo'
    };
    req.file = { path: 'uploads/equipo.jpg' };

    await crearDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        donacion: expect.objectContaining({
          estadoBien: 'nuevo'
        })
      })
    );
  });

  test('Debería retornar 500 si hay error al crear donación', async () => {
    req.body = {
      nombreDonante: 'Test',
      institucion: 'Test',
      descripcionBien: 'Test bien',
      estadoBien: 'usado'
    };
    req.file = { path: 'test.jpg' };

    mockSave.mockRejectedValue(new Error('DB Error'));

    await crearDonacionBienes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al crear donación de bienes',
      error: 'DB Error'
    });
  });
});
