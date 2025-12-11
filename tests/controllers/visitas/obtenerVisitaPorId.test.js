import { jest } from '@jest/globals';

// Mock de visitas utils
jest.unstable_mockModule('../../../src/utils/visitas.utils.js', () => ({
  formatearFecha: jest.fn(),
  validarFechaHoraVisita: jest.fn(),
  generarBloqueId: jest.fn(),
  calcularDisponibilidadBloque: jest.fn(),
  esDiaHabil: jest.fn(),
  obtenerNombreDia: jest.fn()
}));

const { obtenerVisitaPorId } = await import('../../../src/controllers/visita_controller.js');
const visitasUtils = await import('../../../src/utils/visitas.utils.js');
const Visita = (await import('../../../src/models/Visita.js')).default;

describe('GET /api/visita/:id - Obtener Visita Por ID', () => {
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
    Visita.findById = jest.fn();
    visitasUtils.formatearFecha.mockReturnValue('2025-12-20');
  });

  test('Debería retornar 404 si la visita no existe', async () => {
    req.params.id = 'id-inexistente';
    Visita.findById.mockResolvedValue(null);

    await obtenerVisitaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Visita no encontrada'
    });
  });

  test('Debería retornar 200 con la visita encontrada', async () => {
    req.params.id = '123';
    const mockVisita = {
      _id: '123',
      institucion: 'PUCE',
      cantidadPersonas: 25,
      fechaVisita: new Date('2025-12-20'),
      horaBloque: '09:00',
      bloqueId: '2025-12-20_09:00',
      status: 'pendiente',
      descripcion: 'Visita importante',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Visita.findById.mockResolvedValue(mockVisita);

    await obtenerVisitaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '123',
        institucion: 'PUCE',
        cantidadPersonas: 25,
        horaBloque: '09:00',
        status: 'pendiente',
        descripcion: 'Visita importante'
      })
    );
  });

  test('Debería manejar visita sin descripción', async () => {
    req.params.id = '456';
    const mockVisita = {
      _id: '456',
      institucion: 'UCE',
      cantidadPersonas: 30,
      fechaVisita: new Date(),
      horaBloque: '10:00',
      bloqueId: '2025-12-20_10:00',
      status: 'realizada',
      descripcion: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Visita.findById.mockResolvedValue(mockVisita);

    await obtenerVisitaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        descripcion: ''
      })
    );
  });

  test('Debería retornar 500 si hay error', async () => {
    req.params.id = '789';
    Visita.findById.mockRejectedValue(new Error('DB Error'));

    await obtenerVisitaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener visita',
      error: 'DB Error'
    });
  });
});
