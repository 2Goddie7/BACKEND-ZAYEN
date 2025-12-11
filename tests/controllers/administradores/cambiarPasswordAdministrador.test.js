import { jest } from '@jest/globals';

// Registrar mocks antes de importar los módulos que los usan
jest.mock('src/models/Administrador.js');
jest.mock('src/config/nodemailer.js');

import { cambiarPasswordAdministrador } from 'src/controllers/administrador_controller.js';
import Administrador from 'src/models/Administrador.js';

describe('PUT /api/administrador/cambiar-password - Cambiar Password Administrador', () => {
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

  test('Debería retornar 400 si faltan campos', async () => {
    req.user = { _id: '123' };
    req.body = { actualPassword: 'pass123' };

    await cambiarPasswordAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Todos los campos son obligatorios'
    });
  });

  test('Debería retornar 400 si la nueva contraseña es muy corta', async () => {
    req.user = { _id: '123' };
    req.body = { actualPassword: 'pass123', nuevaPassword: 'short' };

    await cambiarPasswordAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  });

  test('Debería retornar 401 si la contraseña actual es incorrecta', async () => {
    const mockAdmin = {
      _id: '123',
      matchPassword: jest.fn().mockResolvedValue(false)
    };
    req.user = { id: '123' };
    req.body = { actualPassword: 'wrongpass', nuevaPassword: 'newpassword123' };
    
    Administrador.findById = jest.fn().mockResolvedValue(mockAdmin);

    await cambiarPasswordAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'La contraseña actual es incorrecta'
    });
  });

  test('Debería retornar 200 si se cambia la contraseña correctamente', async () => {
    const mockAdmin = {
      _id: '123',
      matchPassword: jest.fn().mockResolvedValue(true),
      encrypPassword: jest.fn().mockResolvedValue('hashed-new-password'),
      save: jest.fn().mockResolvedValue(true)
    };
    req.user = { id: '123' };
    req.body = { actualPassword: 'oldpass123', nuevaPassword: 'newpassword123' };
    
    Administrador.findById = jest.fn().mockResolvedValue(mockAdmin);

    await cambiarPasswordAdministrador(req, res);

    expect(mockAdmin.encrypPassword).toHaveBeenCalledWith('newpassword123');
    expect(mockAdmin.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Contraseña actualizada correctamente'
    });
  });

  test('Debería retornar 500 si hay error al cambiar contraseña', async () => {
    req.user = { id: '123' };
    req.body = { actualPassword: 'pass123', nuevaPassword: 'newpassword123' };
    
    Administrador.findById = jest.fn().mockRejectedValue(new Error('DB Error'));

    await cambiarPasswordAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al cambiar la contraseña',
      error: 'DB Error'
    });
  });
});
