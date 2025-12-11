import { jest } from '@jest/globals';
import { actualizarPerfilPasante } from '../../../src/controllers/pasante_controller.js';

describe('PUT /api/pasante/perfil - Actualizar Perfil Pasante', () => {
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

  test('Debería actualizar el celular del pasante', async () => {
    const mockPasante = {
      _id: '123',
      nombre: 'Juan Pasante',
      email: 'pasante@puce.edu.ec',
      celular: '0999999999',
      fotoPerfil: 'url',
      save: jest.fn().mockResolvedValue(true)
    };
    req.user = mockPasante;
    req.body.celular = '0988888888';

    await actualizarPerfilPasante(req, res);

    expect(mockPasante.celular).toBe('0988888888');
    expect(mockPasante.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Perfil actualizado correctamente',
      pasante: expect.objectContaining({
        id: '123',
        celular: '0988888888'
      })
    });
  });

  test('Debería retornar 200 sin cambios si no se envía celular', async () => {
    const mockPasante = {
      _id: '456',
      nombre: 'María Pasante',
      email: 'maria@puce.edu.ec',
      celular: '0977777777',
      fotoPerfil: null,
      save: jest.fn().mockResolvedValue(true)
    };
    req.user = mockPasante;
    req.body = {};

    await actualizarPerfilPasante(req, res);

    expect(mockPasante.celular).toBe('0977777777');
    expect(mockPasante.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Debería retornar 500 si hay error al actualizar', async () => {
    const mockPasante = {
      save: jest.fn().mockRejectedValue(new Error('DB Error'))
    };
    req.user = mockPasante;
    req.body.celular = '0988888888';

    await actualizarPerfilPasante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al actualizar perfil',
      error: 'DB Error'
    });
  });
});
