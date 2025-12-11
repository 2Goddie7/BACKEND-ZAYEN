import { jest } from '@jest/globals';
import { confirmarCuentaAdmini } from '../../../src/controllers/administrador_controller.js';
import Administrador from '../../../src/models/Administrador.js';

// Mocks
jest.mock('../../../src/models/Administrador.js');
jest.mock('../../../src/config/nodemailer.js');

describe('GET /api/administrador/confirmar/:token - Confirmar Cuenta Admini', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('Debería retornar 400 si el token es inválido', async () => {
    req.params.token = 'token-invalido';
    Administrador.findOne = jest.fn().mockResolvedValue(null);

    await confirmarCuentaAdmini(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Token inválido o cuenta ya confirmada'
    });
  });

  test('Debería retornar 200 y confirmar la cuenta correctamente', async () => {
    req.params.token = 'token-valido';
    const mockAdmin = {
      confirmEmail: false,
      token: 'token-valido',
      save: jest.fn().mockResolvedValue(true)
    };
    Administrador.findOne = jest.fn().mockResolvedValue(mockAdmin);

    await confirmarCuentaAdmini(req, res);

    expect(mockAdmin.confirmEmail).toBe(true);
    expect(mockAdmin.token).toBe(null);
    expect(mockAdmin.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Cuenta confirmada correctamente. Ya puedes iniciar sesión'
    });
  });

  test('Debería retornar 500 si hay error al confirmar cuenta', async () => {
    req.params.token = 'token-valido';
    Administrador.findOne = jest.fn().mockRejectedValue(new Error('DB Error'));

    await confirmarCuentaAdmini(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al confirmar la cuenta',
      error: 'DB Error'
    });
  });
});
