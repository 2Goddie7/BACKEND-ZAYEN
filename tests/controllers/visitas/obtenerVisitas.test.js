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

const { obtenerVisitas } = await import('../../../src/controllers/visita_controller.js');
const visitasUtils = await import('../../../src/utils/visitas.utils.js');
const Visita = (await import('../../../src/models/Visita.js')).default;

describe('GET /api/visita - Obtener Visitas', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    Visita.find = jest.fn();
    visitasUtils.formatearFecha.mockReturnValue('2025-12-01');
  });

  test('Debería retornar todas las visitas sin filtros', async () => {
    const mockVisitas = [
      {
        _id: '1',
        institucion: 'PUCE',
        cantidadPersonas: 20,
        fechaVisita: new Date(),
        horaBloque: '09:00',
        status: 'pendiente',
        descripcion: 'Visita',
        createdAt: new Date()
      },
      {
        _id: '2',
        institucion: 'UCE',
        cantidadPersonas: 15,
        fechaVisita: new Date(),
        horaBloque: '10:00',
        status: 'realizada',
        descripcion: '',
        createdAt: new Date()
      }
    ];

    Visita.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockVisitas)
    });

    await obtenerVisitas(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      total: 2,
      totalPersonas: 35,
      visitas: expect.any(Array)
    });
  });

  test('Debería filtrar visitas por status', async () => {
    req.query.status = 'pendiente';

    Visita.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitas(req, res);

    expect(Visita.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pendiente' })
    );
  });

  test('Debería filtrar visitas por institución', async () => {
    req.query.institucion = 'PUCE';

    Visita.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitas(req, res);

    expect(Visita.find).toHaveBeenCalledWith(
      expect.objectContaining({
        institucion: expect.any(RegExp)
      })
    );
  });

  test('Debería filtrar visitas por horaBloque', async () => {
    req.query.horaBloque = '10:00';

    Visita.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitas(req, res);

    expect(Visita.find).toHaveBeenCalledWith(
      expect.objectContaining({ horaBloque: '10:00' })
    );
  });

  test('Debería buscar por término general', async () => {
    req.query.search = 'PUCE';

    Visita.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    await obtenerVisitas(req, res);

    expect(Visita.find).toHaveBeenCalledWith(
      expect.objectContaining({
        institucion: expect.any(RegExp)
      })
    );
  });

  test('Debería retornar 500 si hay error', async () => {
    Visita.find = jest.fn().mockImplementation(() => {
      throw new Error('DB Error');
    });

    await obtenerVisitas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Error al obtener visitas',
      error: 'DB Error'
    });
  });
});
