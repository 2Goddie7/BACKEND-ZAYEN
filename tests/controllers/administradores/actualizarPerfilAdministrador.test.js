import { jest } from '@jest/globals';
import { actualizarPerfilAdministrador } from '../../../src/controllers/administrador_controller.js';

jest.mock('../../../src/config/nodemailer.js');

describe('PUT /api/administrador/perfil - Actualizar Perfil Administrador', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: null,
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('Debería actualizar el celular del administrador', async () => {
    const mockAdmin = {
      _id: '123',
      nombre: 'Admin Test',
      email: 'admin@test.com',
      celular: '0999999999',
      fotoPerfil: 'url',
      save: jest.fn().mockResolvedValue(true)
    };
    req.user = mockAdmin;
    req.body.celular = '0988888888';

    await actualizarPerfilAdministrador(req, res);

    expect(mockAdmin.celular).toBe('0988888888');
    expect(mockAdmin.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Perfil actualizado correctamente',
      admin: expect.objectContaining({
        id: '123',
        celular: '0988888888'
      })
    });
  });

  test('Debería retornar 200 sin cambios si no se envía celular', async () => {
    const mockAdmin = {
      _id: '123',
      nombre: 'Admin Test',
      email: 'admin@test.com',
      celular: '0999999999',
      fotoPerfil: 'url',
      save: jest.fn().mockResolvedValue(true)
    };
    req.user = mockAdmin;
    req.body = {};

    await actualizarPerfilAdministrador(req, res);

    expect(mockAdmin.celular).toBe('0999999999');
    expect(mockAdmin.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Debería retornar 500 si hay error al actualizar', async () => {
    const mockAdmin = {
      save: jest.fn().mockRejectedValue(new Error('DB Error'))
    };
    req.user = mockAdmin;
    req.body.celular = '0988888888';

    await actualizarPerfilAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al actualizar perfil',
      error: 'DB Error'
    });
  });
});
