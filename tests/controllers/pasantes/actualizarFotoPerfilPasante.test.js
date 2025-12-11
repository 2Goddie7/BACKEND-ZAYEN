import { jest } from '@jest/globals';
import { actualizarFotoPerfilPasante } from '../../../src/controllers/pasante_controller.js';

describe('PUT /api/pasante/perfil/foto - Actualizar Foto Perfil Pasante', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: null,
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('Debería retornar 400 si no se sube imagen', async () => {
    req.user = { _id: '123' };
    req.file = null;

    await actualizarFotoPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'No se subió ninguna imagen'
    });
  });

  test('Debería actualizar la foto de perfil correctamente', async () => {
    const mockPasante = {
      _id: '123',
      nombre: 'Juan Pasante',
      fotoPerfil: 'old-url',
      save: jest.fn().mockResolvedValue(true)
    };
    req.user = mockPasante;
    req.file = { path: 'uploads/nueva-foto.jpg' };

    await actualizarFotoPerfilPasante(req, res);

    expect(mockPasante.fotoPerfil).toBe('uploads/nueva-foto.jpg');
    expect(mockPasante.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Foto de perfil actualizada correctamente',
      fotoPerfil: 'uploads/nueva-foto.jpg'
    });
  });

  test('Debería retornar 500 si hay error al guardar', async () => {
    const mockPasante = {
      fotoPerfil: 'old-url',
      save: jest.fn().mockRejectedValue(new Error('DB Error'))
    };
    req.user = mockPasante;
    req.file = { path: 'uploads/foto.jpg' };

    await actualizarFotoPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al actualizar foto',
      error: 'DB Error'
    });
  });
});
