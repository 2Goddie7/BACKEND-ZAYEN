import { jest } from '@jest/globals';
import { obtenerPerfilAdministrador } from '../../../src/controllers/administrador_controller.js';

jest.mock('../../../src/config/nodemailer.js');

describe('GET /api/administrador/perfil - Obtener Perfil Administrador', () => {
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

  test('Debería retornar 404 si el administrador no existe', async () => {
    req.user = null;

    await obtenerPerfilAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Administrador no encontrado'
    });
  });

  test('Debería retornar 200 con el perfil del administrador principal', async () => {
    req.user = {
      _id: '123',
      nombre: 'Admin Principal',
      email: 'admin@test.com',
      rol: 'administrador',
      celular: '0999999999',
      fotoPerfil: 'url'
    };

    await obtenerPerfilAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: '123',
      nombre: 'Admin Principal',
      email: 'admin@test.com',
      rol: 'administrador',
      celular: '0999999999',
      fotoPerfil: 'url'
    });
  });

  test('Debería retornar 200 con el perfil del admini estudiante incluyendo facultad', async () => {
    req.user = {
      _id: '456',
      nombre: 'Admini Estudiante',
      email: 'admini@test.com',
      rol: 'admini',
      tipo: 'estudiante',
      facultad: 'Ingeniería',
      horasDePasantia: 120,
      celular: '0988888888',
      fotoPerfil: null
    };

    await obtenerPerfilAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: '456',
      nombre: 'Admini Estudiante',
      email: 'admini@test.com',
      rol: 'admini',
      tipo: 'estudiante',
      facultad: 'Ingeniería',
      horasDePasantia: 120,
      celular: '0988888888',
      fotoPerfil: null
    });
  });

  test('Debería retornar 500 si ocurre un error', async () => {
    req.user = {
      _id: '789',
      nombre: 'Admin Error'
    };
    // Forzar error
    Object.defineProperty(req, 'user', {
      get: () => {
        throw new Error('Test Error');
      }
    });

    await obtenerPerfilAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener perfil',
      error: 'Test Error'
    });
  });
});
