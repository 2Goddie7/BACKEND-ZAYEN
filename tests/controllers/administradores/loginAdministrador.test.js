import { jest } from '@jest/globals';

// Mocks primero
const mockGenerarToken = jest.fn();
jest.unstable_mockModule('../../../src/middleware/jwt.js', () => ({
  generarToken: mockGenerarToken
}));

// Luego imports dinámicos
const { loginAdministrador } = await import('../../../src/controllers/administrador_controller.js');
const Administrador = (await import('../../../src/models/Administrador.js')).default;

jest.mock('../../../src/models/Administrador.js');
jest.mock('../../../src/config/nodemailer.js');

describe('POST /api/administrador/login - Login Administrador', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('Debería retornar 400 si faltan campos requeridos', async () => {
    req.body = { email: 'test@test.com' };

    await loginAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Todos los campos son obligatorios'
    });
  });

  test('Debería retornar 404 si el correo no está registrado', async () => {
    req.body = { email: 'noexiste@test.com', password: 'pass123' };
    Administrador.findOne = jest.fn().mockResolvedValue(null);

    await loginAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'El correo no está registrado'
    });
  });

  test('Debería retornar 403 si la cuenta no está confirmada', async () => {
    req.body = { email: 'test@test.com', password: 'password123' };
    const mockAdmin = {
      confirmEmail: false
    };
    Administrador.findOne = jest.fn().mockResolvedValue(mockAdmin);

    await loginAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Debes confirmar tu cuenta por correo antes de iniciar sesión'
    });
  });

  test('Debería retornar 401 si las credenciales son incorrectas', async () => {
    req.body = { email: 'test@test.com', password: 'wrongpass' };
    const mockAdmin = {
      _id: '123',
      email: 'test@test.com',
      confirmEmail: true,
      status: true,
      rol: 'administrador',
      matchPassword: jest.fn().mockResolvedValue(false)
    };
    Administrador.findOne = jest.fn().mockResolvedValue(mockAdmin);

    await loginAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      msg: '¡Credenciales incorrectas!'
    });
  });

  test('Debería retornar 200 y un token si el login es exitoso', async () => {
    req.body = { email: 'admin@test.com', password: 'password123' };
    const mockAdmin = {
      _id: '123',
      email: 'admin@test.com',
      nombre: 'Admin Test',
      confirmEmail: true,
      status: true,
      rol: 'administrador',
      celular: '0999999999',
      fotoPerfil: 'url',
      matchPassword: jest.fn().mockResolvedValue(true)
    };
    Administrador.findOne = jest.fn().mockResolvedValue(mockAdmin);
    mockGenerarToken.mockReturnValue('fake-token');

    await loginAdministrador(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Inicio de sesión exitoso',
      token: 'fake-token',
      admin: expect.objectContaining({
        id: '123',
        email: 'admin@test.com'
      })
    });
  });
});
