import { jest } from '@jest/globals';
import { obtenerPerfilPasante } from '../../../src/controllers/pasante_controller.js';

describe('GET /api/pasante/perfil - Obtener Perfil Pasante', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('Debería retornar 404 si el pasante no existe', async () => {
    req.user = null;

    await obtenerPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Pasante no encontrado'
    });
  });

  test('Debería retornar 200 con el perfil del pasante', async () => {
    req.user = {
      _id: '123',
      nombre: 'Juan Pasante',
      email: 'pasante@puce.edu.ec',
      facultad: 'Ingeniería',
      horasDePasantia: 80,
      celular: '0999999999',
      fotoPerfil: 'url-foto'
    };

    await obtenerPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: '123',
      nombre: 'Juan Pasante',
      email: 'pasante@puce.edu.ec',
      facultad: 'Ingeniería',
      horasDePasantia: 80,
      celular: '0999999999',
      fotoPerfil: 'url-foto'
    });
  });

  test('Debería manejar pasante sin foto de perfil', async () => {
    req.user = {
      _id: '456',
      nombre: 'María Pasante',
      email: 'maria@puce.edu.ec',
      facultad: 'Ciencias',
      horasDePasantia: 120,
      celular: '0988888888',
      fotoPerfil: null
    };

    await obtenerPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        fotoPerfil: null
      })
    );
  });

  test('Debería retornar 500 si hay error', async () => {
    Object.defineProperty(req, 'user', {
      get: () => {
        throw new Error('Test Error');
      }
    });

    await obtenerPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener perfil',
      error: 'Test Error'
    });
  });
});
