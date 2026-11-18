import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { configureApp } from '../src/setup.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';

const ADMIN = { email: 'admin@example.com', password: 'una-contrasena-de-prueba' };
const ID = '8f14e45f-ceea-4b7a-9f3c-2d3b2b6a1e11';

const validSubmission = {
  name: 'Ana',
  age: 27,
  mood: 3,
  emotions: ['ansiedad', 'soledad'],
  duration: 'algunas_semanas',
  impact: 5,
  sleep: 'regular',
  appetite: 'mal',
  selfHarm: 'con_frecuencia',
  email: 'ANA@correo.com',
  phone: '',
  bestTime: 'tarde',
  consent: true,
  priority: 'normal',
};

const validVolunteer = {
  firstName: 'Lucía',
  lastName: 'Pérez',
  career: 'Psicología',
  semester: '6to semestre',
  email: 'LUCIA@correo.com',
  phone: '+58 412 000 0000',
  helpAreas: ['escucha_acompanamiento', 'difusion_redes'],
  availability: 'semanal',
  message: 'Me encantaría ayudar',
  consent: true,
};

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64),
]);

interface AdminRow {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
}

// Tabla admins en memoria: permite probar el flujo real de login, roles y desactivación
function createAdminStore() {
  const rows: AdminRow[] = [];
  const matches = (row: AdminRow, where: Record<string, any> = {}) =>
    Object.entries(where).every(([key, value]) =>
      value && typeof value === 'object' && 'not' in value
        ? row[key as keyof AdminRow] !== value.not
        : row[key as keyof AdminRow] === value,
    );
  const find = (where: Record<string, any>) => rows.find((row) => matches(row, where)) ?? null;
  return {
    rows,
    findUnique: vi.fn(({ where }) => Promise.resolve(find(where))),
    findMany: vi.fn(() => Promise.resolve([...rows])),
    count: vi.fn(({ where }) => Promise.resolve(rows.filter((row) => matches(row, where)).length)),
    create: vi.fn(({ data }) => {
      if (rows.some((row) => row.email === data.email)) return Promise.reject({ code: 'P2002' });
      const row: AdminRow = {
        id: randomUUID(),
        createdAt: new Date(),
        active: true,
        lastLoginAt: null,
        role: 'admin',
        ...data,
      };
      rows.push(row);
      return Promise.resolve(row);
    }),
    update: vi.fn(({ where, data }) => {
      const row = find(where);
      if (!row) return Promise.reject({ code: 'P2025' });
      Object.assign(row, data);
      return Promise.resolve(row);
    }),
    delete: vi.fn(({ where }) => {
      const row = find(where);
      if (!row) return Promise.reject({ code: 'P2025' });
      rows.splice(rows.indexOf(row), 1);
      return Promise.resolve(row);
    }),
  };
}

function createPrismaMock() {
  return {
    admin: createAdminStore(),
    submission: {
      create: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: ID }),
      delete: vi.fn().mockResolvedValue({}),
    },
    volunteer: {
      create: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: ID }),
      delete: vi.fn().mockResolvedValue({}),
    },
    rouletteImage: {
      findMany: vi.fn().mockResolvedValue([{ id: ID, imageUrl: 'https://cdn/x.png' }]),
      findUnique: vi.fn().mockResolvedValue({ id: ID, storagePath: 'x.png' }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: ID, ...data })),
      update: vi.fn().mockResolvedValue({ id: ID, active: false }),
      delete: vi.fn().mockResolvedValue({}),
    },
    ally: {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: ID, name: 'Aliado', logoUrl: 'https://cdn/l.png', websiteUrl: 'https://a.org' }]),
      findUnique: vi.fn().mockResolvedValue({ id: ID, storagePath: 'l.png' }),
      aggregate: vi.fn().mockResolvedValue({ _max: { position: 2 } }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: ID, ...data })),
      update: vi.fn().mockResolvedValue({ id: ID }),
      delete: vi.fn().mockResolvedValue({}),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
  };
}

function createSupabaseMock() {
  return {
    upload: vi
      .fn()
      .mockResolvedValue({ path: 'uuid-x.png', publicUrl: 'https://cdn/uuid-x.png' }),
    remove: vi.fn().mockResolvedValue(undefined),
    getPublicUrl: vi.fn(),
  };
}

describe('API (e2e con Prisma y Supabase simulados)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;
  let supabase: ReturnType<typeof createSupabaseMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    supabase = createSupabaseMock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(SupabaseService)
      .useValue(supabase)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const login = async () => {
    const res = await request(server()).post('/api/admin/login').send(ADMIN).expect(200);
    return `Bearer ${res.body.accessToken as string}`;
  };

  describe('base', () => {
    it('GET /api responde ok y aplica helmet', async () => {
      const res = await request(server()).get('/api').expect(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('rutas inexistentes responden 404 en español', async () => {
      const res = await request(server()).get('/api/nada').expect(404);
      expect(res.body.message).toBe('No encontramos lo que buscas.');
    });
  });

  describe('POST /api/submissions', () => {
    it('guarda el envío y recalcula la prioridad en el servidor', async () => {
      const res = await request(server()).post('/api/submissions').send(validSubmission).expect(201);
      expect(res.body).toEqual({ ok: true });
      expect(prisma.submission.create).toHaveBeenCalledTimes(1);
      const { data } = prisma.submission.create.mock.calls[0][0];
      expect(data).toMatchObject({
        selfHarmThoughts: 'con_frecuencia',
        priority: 'alta',
        email: 'ana@correo.com',
        phone: null,
        consent: true,
      });
    });

    it('marca prioridad normal cuando la respuesta es "no", aunque el cliente diga "alta"', async () => {
      await request(server())
        .post('/api/submissions')
        .send({ ...validSubmission, selfHarm: 'no', priority: 'alta' })
        .expect(201);
      expect(prisma.submission.create.mock.calls[0][0].data.priority).toBe('normal');
    });

    it('exige consentimiento', async () => {
      const res = await request(server())
        .post('/api/submissions')
        .send({ ...validSubmission, consent: false })
        .expect(400);
      expect(res.body.message).toContain('Necesitamos tu consentimiento para poder contactarte.');
      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

    it('rechaza campos desconocidos y valores fuera de rango, con mensajes en español', async () => {
      const res = await request(server())
        .post('/api/submissions')
        .send({ ...validSubmission, age: 5, hack: true })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining(['La edad debe ser de 10 años o más.', 'El campo "hack" no está permitido.']),
      );
    });

    it('con honeypot relleno responde 201 sin guardar', async () => {
      await request(server())
        .post('/api/submissions')
        .send({ ...validSubmission, website: 'http://spam.example' })
        .expect(201);
      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

    it('limita a 5 envíos por minuto por IP', async () => {
      for (let i = 0; i < 5; i++) {
        await request(server()).post('/api/submissions').send(validSubmission).expect(201);
      }
      const res = await request(server()).post('/api/submissions').send(validSubmission).expect(429);
      expect(res.body.message).toBe('Demasiadas solicitudes. Inténtalo de nuevo en un minuto.');
    });
  });

  describe('API pública de contenido', () => {
    it('GET /api/roulette-images devuelve [{ id, imageUrl }] de imágenes activas', async () => {
      const res = await request(server()).get('/api/roulette-images').expect(200);
      expect(res.body).toEqual([{ id: ID, imageUrl: 'https://cdn/x.png' }]);
      expect(prisma.rouletteImage.findMany.mock.calls[0][0].where).toEqual({ active: true });
    });

    it('GET /api/allies devuelve aliados activos ordenados por position', async () => {
      const res = await request(server()).get('/api/allies').expect(200);
      expect(res.body[0]).toEqual({
        id: ID,
        name: 'Aliado',
        logoUrl: 'https://cdn/l.png',
        websiteUrl: 'https://a.org',
      });
      const args = prisma.ally.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ active: true });
      expect(args.orderBy[0]).toEqual({ position: 'asc' });
    });
  });

  describe('autenticación de administrador', () => {
    it('login correcto devuelve un JWT', async () => {
      const res = await request(server()).post('/api/admin/login').send(ADMIN).expect(200);
      expect(res.body.accessToken.split('.')).toHaveLength(3);
      expect(res.body.expiresIn).toBe(28800);
    });

    it('login con credenciales incorrectas responde 401 en español', async () => {
      const res = await request(server())
        .post('/api/admin/login')
        .send({ ...ADMIN, password: 'incorrecta' })
        .expect(401);
      expect(res.body.message).toBe('Correo o contraseña incorrectos.');
    });

    it('limita los intentos de login a 5 por minuto', async () => {
      for (let i = 0; i < 5; i++) {
        await request(server()).post('/api/admin/login').send({ ...ADMIN, password: 'mal' }).expect(401);
      }
      await request(server()).post('/api/admin/login').send(ADMIN).expect(429);
    });

    it.each([
      ['GET', '/api/admin/stats'],
      ['GET', '/api/admin/submissions'],
      ['GET', '/api/admin/submissions/export'],
      ['PATCH', `/api/admin/submissions/${ID}`],
      ['DELETE', `/api/admin/submissions/${ID}`],
      ['GET', '/api/admin/roulette-images'],
      ['POST', '/api/admin/roulette-images'],
      ['PATCH', `/api/admin/roulette-images/${ID}`],
      ['DELETE', `/api/admin/roulette-images/${ID}`],
      ['GET', '/api/admin/allies'],
      ['POST', '/api/admin/allies'],
      ['PATCH', `/api/admin/allies/${ID}`],
      ['DELETE', `/api/admin/allies/${ID}`],
    ])('%s %s exige token', async (method, path) => {
      const res = await request(server())[method.toLowerCase() as 'get'](path).expect(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('rechaza tokens manipulados', async () => {
      await request(server())
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer abc.def.ghi')
        .expect(401);
    });
  });

  describe('admin: solicitudes', () => {
    it('lista con paginación y filtros', async () => {
      const token = await login();
      prisma.submission.count.mockResolvedValue(45);
      const res = await request(server())
        .get('/api/admin/submissions?page=2&pageSize=20&status=nuevo&priority=alta')
        .set('Authorization', token)
        .expect(200);
      expect(res.body.meta).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
      const args = prisma.submission.findMany.mock.calls[0][0];
      expect(args).toMatchObject({
        where: { status: 'nuevo', priority: 'alta' },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 20,
      });
    });

    it('rechaza filtros inválidos', async () => {
      const token = await login();
      await request(server())
        .get('/api/admin/submissions?status=otro')
        .set('Authorization', token)
        .expect(400);
    });

    it('exporta CSV con BOM UTF-8', async () => {
      const token = await login();
      prisma.submission.findMany.mockResolvedValue([
        {
          id: ID,
          createdAt: new Date('2026-11-16T12:00:00Z'),
          name: 'Ñandú',
          age: 20,
          mood: 3,
          emotions: ['tristeza', 'miedo'],
          duration: 'unos_dias',
          impact: 4,
          sleep: 'bien',
          appetite: 'bien',
          selfHarmThoughts: 'no',
          priority: 'normal',
          email: 'a@b.co',
          phone: null,
          bestTime: 'noche',
          consent: true,
          status: 'nuevo',
          notes: '=HYPERLINK("x")',
        },
      ]);
      const res = await request(server())
        .get('/api/admin/submissions/export')
        .set('Authorization', token)
        .buffer(true)
        .parse((response, callback) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="solicitudes-\d{4}-\d{2}-\d{2}\.csv"/);
      const body = res.body as Buffer;
      expect([...body.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
      const text = body.toString('utf8');
      expect(text).toContain('Ñandú');
      expect(text).toContain("'=HYPERLINK");
    });

    it('PATCH cambia estado y notas; exige al menos un campo y un uuid', async () => {
      const token = await login();
      await request(server())
        .patch(`/api/admin/submissions/${ID}`)
        .set('Authorization', token)
        .send({ status: 'contactado', notes: 'Se llamó' })
        .expect(200);
      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { status: 'contactado', notes: 'Se llamó' },
      });
      await request(server()).patch(`/api/admin/submissions/${ID}`).set('Authorization', token).send({}).expect(400);
      await request(server()).patch('/api/admin/submissions/no-es-uuid').set('Authorization', token).send({ status: 'cerrado' }).expect(400);
    });

    it('PATCH/DELETE devuelven 404 si no existe', async () => {
      const token = await login();
      prisma.submission.update.mockRejectedValue(Object.assign(new Error('x'), { code: 'P2025' }));
      prisma.submission.delete.mockRejectedValue(Object.assign(new Error('x'), { code: 'P2025' }));
      await request(server()).patch(`/api/admin/submissions/${ID}`).set('Authorization', token).send({ status: 'cerrado' }).expect(404);
      await request(server()).delete(`/api/admin/submissions/${ID}`).set('Authorization', token).expect(404);
    });

    it('DELETE responde 204', async () => {
      const token = await login();
      await request(server()).delete(`/api/admin/submissions/${ID}`).set('Authorization', token).expect(204);
    });

    it('GET /stats devuelve totales y 14 días', async () => {
      const token = await login();
      prisma.submission.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4).mockResolvedValueOnce(2);
      const res = await request(server()).get('/api/admin/stats').set('Authorization', token).expect(200);
      expect(res.body).toMatchObject({ total: 10, nuevos: 4, prioridadAlta: 2 });
      expect(res.body.enviosPorDia).toHaveLength(14);
    });
  });

  describe('administradores y roles', () => {
    const asJson = (token: string) => ({ Authorization: token });
    const created = async (superToken: string, role = 'admin') => {
      const body = {
        name: 'Beto',
        email: 'Beto@Correo.com',
        password: 'contrasena-de-beto',
        role,
      };
      const res = await request(server())
        .post('/api/admin/admins')
        .set(asJson(superToken))
        .send(body)
        .expect(201);
      return { id: res.body.id as string, body, res };
    };
    const loginAs = (email: string, password: string) =>
      request(server()).post('/api/admin/login').send({ email, password });

    it('el primer login con ADMIN_EMAIL crea al superadmin con hash y responde con sus datos', async () => {
      const res = await loginAs(ADMIN.email, ADMIN.password).expect(200);
      expect(res.body.admin).toMatchObject({ email: ADMIN.email, role: 'superadmin', active: true });
      expect(res.body.admin).not.toHaveProperty('passwordHash');
      expect(prisma.admin.rows).toHaveLength(1);
      expect(prisma.admin.rows[0].passwordHash).toMatch(/^\$2[aby]\$/);
      expect(prisma.admin.rows[0].lastLoginAt).toBeInstanceOf(Date);
      // Un segundo login usa la tabla y no crea otro
      await loginAs(ADMIN.email.toUpperCase(), ADMIN.password).expect(200);
      expect(prisma.admin.rows).toHaveLength(1);
    });

    it('GET /api/admin/me devuelve al usuario del token', async () => {
      const token = await login();
      const res = await request(server()).get('/api/admin/me').set(asJson(token)).expect(200);
      expect(res.body).toMatchObject({ email: ADMIN.email, role: 'superadmin' });
    });

    it('crea un admin (correo en minúsculas, sin hash en la respuesta) y este puede iniciar sesión', async () => {
      const token = await login();
      const { res } = await created(token);
      expect(res.body).toMatchObject({ email: 'beto@correo.com', role: 'admin', active: true });
      expect(JSON.stringify(res.body)).not.toMatch(/hash|contrasena-de-beto/i);

      const session = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(200);
      expect(session.body.admin.role).toBe('admin');
      await request(server())
        .get('/api/admin/stats')
        .set(asJson(`Bearer ${session.body.accessToken as string}`))
        .expect(200);
    });

    it('rechaza correos repetidos (409) y contraseñas de menos de 10 caracteres (400)', async () => {
      const token = await login();
      const { body } = await created(token);
      await request(server()).post('/api/admin/admins').set(asJson(token)).send(body).expect(409);
      await request(server())
        .post('/api/admin/admins')
        .set(asJson(token))
        .send({ ...body, email: 'otro@correo.com', password: 'corta' })
        .expect(400);
    });

    it('un admin desactivado pierde el acceso de inmediato y no puede volver a entrar', async () => {
      const superToken = await login();
      const { id } = await created(superToken);
      const session = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(200);
      const betoToken = `Bearer ${session.body.accessToken as string}`;
      await request(server()).get('/api/admin/me').set(asJson(betoToken)).expect(200);

      await request(server())
        .patch(`/api/admin/admins/${id}`)
        .set(asJson(superToken))
        .send({ active: false })
        .expect(200);

      await request(server()).get('/api/admin/me').set(asJson(betoToken)).expect(401);
      await request(server()).get('/api/admin/stats').set(asJson(betoToken)).expect(401);
      const retry = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(403);
      expect(retry.body.message).toContain('desactivada');
    });

    it('un admin eliminado también pierde el acceso', async () => {
      const superToken = await login();
      const { id } = await created(superToken);
      const session = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(200);
      await request(server()).delete(`/api/admin/admins/${id}`).set(asJson(superToken)).expect(204);
      await request(server())
        .get('/api/admin/me')
        .set(asJson(`Bearer ${session.body.accessToken as string}`))
        .expect(401);
    });

    it('un admin recibe 403 en las rutas de superadmin pero puede usar el resto', async () => {
      const superToken = await login();
      const { id } = await created(superToken);
      const session = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(200);
      const betoToken = asJson(`Bearer ${session.body.accessToken as string}`);

      await request(server()).get('/api/admin/admins').set(betoToken).expect(403);
      await request(server())
        .post('/api/admin/admins')
        .set(betoToken)
        .send({ name: 'X', email: 'x@correo.com', password: '1234567890' })
        .expect(403);
      await request(server()).patch(`/api/admin/admins/${id}`).set(betoToken).send({ role: 'superadmin' }).expect(403);
      await request(server()).delete(`/api/admin/admins/${id}`).set(betoToken).expect(403);
      await request(server()).get('/api/admin/submissions').set(betoToken).expect(200);
    });

    it('un cambio de rol se aplica al instante (el rol sale de la base, no del token)', async () => {
      const superToken = await login();
      const { id } = await created(superToken, 'superadmin');
      const session = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(200);
      const betoToken = asJson(`Bearer ${session.body.accessToken as string}`);
      await request(server()).get('/api/admin/admins').set(betoToken).expect(200);
      await request(server()).patch(`/api/admin/admins/${id}`).set(asJson(superToken)).send({ role: 'admin' }).expect(200);
      await request(server()).get('/api/admin/admins').set(betoToken).expect(403);
    });

    it('no permite eliminarse, desactivarse ni degradarse a uno mismo', async () => {
      const token = await login();
      const me = await request(server()).get('/api/admin/me').set(asJson(token));
      const url = `/api/admin/admins/${me.body.id as string}`;
      await request(server()).delete(url).set(asJson(token)).expect(400);
      await request(server()).patch(url).set(asJson(token)).send({ active: false }).expect(400);
      await request(server()).patch(url).set(asJson(token)).send({ role: 'admin' }).expect(400);
      expect(prisma.admin.rows[0]).toMatchObject({ role: 'superadmin', active: true });
    });

    it('cada admin cambia su contraseña con la actual; las claves viejas dejan de servir', async () => {
      const superToken = await login();
      await created(superToken);
      const session = await loginAs('beto@correo.com', 'contrasena-de-beto').expect(200);
      const betoToken = asJson(`Bearer ${session.body.accessToken as string}`);

      const wrong = await request(server())
        .patch('/api/admin/me/password')
        .set(betoToken)
        .send({ currentPassword: 'incorrecta', newPassword: 'una-nueva-segura' })
        .expect(400);
      expect(wrong.body.message).toBe('La contraseña actual no es correcta.');
      await request(server())
        .patch('/api/admin/me/password')
        .set(betoToken)
        .send({ currentPassword: 'contrasena-de-beto', newPassword: 'corta' })
        .expect(400);
      await request(server())
        .patch('/api/admin/me/password')
        .set(betoToken)
        .send({ currentPassword: 'contrasena-de-beto', newPassword: 'una-nueva-segura' })
        .expect(204);

      await loginAs('beto@correo.com', 'contrasena-de-beto').expect(401);
      await loginAs('beto@correo.com', 'una-nueva-segura').expect(200);
    });

    it('un superadmin restablece la contraseña de otro admin', async () => {
      const superToken = await login();
      const { id } = await created(superToken);
      await request(server())
        .patch(`/api/admin/admins/${id}`)
        .set(asJson(superToken))
        .send({ password: 'restablecida-123' })
        .expect(200);
      await loginAs('beto@correo.com', 'restablecida-123').expect(200);
    });

    it('GET /api/admin/admins no expone hashes', async () => {
      const token = await login();
      const res = await request(server()).get('/api/admin/admins').set(asJson(token)).expect(200);
      expect(res.body).toHaveLength(1);
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$|passwordHash/);
    });

    it.each([
      ['GET', '/api/admin/me'],
      ['PATCH', '/api/admin/me/password'],
      ['GET', '/api/admin/admins'],
      ['POST', '/api/admin/admins'],
      ['PATCH', `/api/admin/admins/${ID}`],
      ['DELETE', `/api/admin/admins/${ID}`],
    ])('%s %s exige token', async (method, path) => {
      await request(server())[method.toLowerCase() as 'get'](path).expect(401);
    });
  });

  describe('voluntarios', () => {
    it('POST /api/volunteers guarda al voluntario con textos limpios', async () => {
      const res = await request(server())
        .post('/api/volunteers')
        .send({ ...validVolunteer, message: '<b>Hola</b>   mundo' })
        .expect(201);
      expect(res.body).toEqual({ ok: true });
      expect(prisma.volunteer.create).toHaveBeenCalledTimes(1);
      expect(prisma.volunteer.create.mock.calls[0][0].data).toMatchObject({
        firstName: 'Lucía',
        email: 'lucia@correo.com',
        helpAreas: ['escucha_acompanamiento', 'difusion_redes'],
        availability: 'semanal',
        message: 'Hola mundo',
        consent: true,
      });
    });

    it('rechaza consentimiento falso, campos desconocidos y valores inválidos', async () => {
      const noConsent = await request(server())
        .post('/api/volunteers')
        .send({ ...validVolunteer, consent: false })
        .expect(400);
      expect(noConsent.body.message).toContain('Necesitamos tu consentimiento para poder contactarte.');
      await request(server())
        .post('/api/volunteers')
        .send({ ...validVolunteer, status: 'activo' })
        .expect(400);
      await request(server())
        .post('/api/volunteers')
        .send({ ...validVolunteer, helpAreas: [] })
        .expect(400);
      expect(prisma.volunteer.create).not.toHaveBeenCalled();
    });

    it('con honeypot relleno responde 201 sin guardar', async () => {
      await request(server())
        .post('/api/volunteers')
        .send({ ...validVolunteer, website: 'http://spam.example' })
        .expect(201);
      expect(prisma.volunteer.create).not.toHaveBeenCalled();
    });

    it('limita a 5 envíos por minuto por IP', async () => {
      for (let i = 0; i < 5; i++) {
        await request(server()).post('/api/volunteers').send(validVolunteer).expect(201);
      }
      await request(server()).post('/api/volunteers').send(validVolunteer).expect(429);
    });

    it('rechaza las rutas admin sin token', async () => {
      await request(server()).get('/api/admin/volunteers').expect(401);
      await request(server()).get('/api/admin/volunteers/export').expect(401);
      await request(server()).patch(`/api/admin/volunteers/${ID}`).send({ status: 'activo' }).expect(401);
      await request(server()).delete(`/api/admin/volunteers/${ID}`).expect(401);
    });

    it('lista con paginación, filtro por estado y búsqueda', async () => {
      const token = await login();
      prisma.volunteer.count.mockResolvedValue(45);
      const res = await request(server())
        .get('/api/admin/volunteers?page=2&pageSize=20&status=nuevo&search=lucia%20perez')
        .set('Authorization', token)
        .expect(200);
      expect(res.body.meta).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
      const args = prisma.volunteer.findMany.mock.calls[0][0];
      expect(args).toMatchObject({
        where: { status: 'nuevo' },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 20,
      });
      expect(args.where.AND).toHaveLength(2);
    });

    it('rechaza filtros inválidos', async () => {
      const token = await login();
      await request(server()).get('/api/admin/volunteers?status=cerrado').set('Authorization', token).expect(400);
    });

    it('exporta CSV con BOM, delimitador ; y protección contra fórmulas', async () => {
      const token = await login();
      prisma.volunteer.findMany.mockResolvedValue([
        {
          id: ID,
          createdAt: new Date('2026-11-16T12:00:00Z'),
          firstName: 'Lucía',
          lastName: 'Pérez',
          career: 'Psicología',
          semester: null,
          email: 'l@b.co',
          phone: '+58 412 000 0000',
          helpAreas: ['tecnologia', 'donaciones'],
          availability: 'semanal',
          message: '=HYPERLINK("x")',
          consent: true,
          status: 'nuevo',
          notes: null,
        },
      ]);
      const res = await request(server())
        .get('/api/admin/volunteers/export?delimiter=;')
        .set('Authorization', token)
        .buffer(true)
        .parse((response, callback) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);
      const body = (res.body as Buffer).toString('utf8');
      expect(res.headers['content-type']).toContain('text/csv');
      expect(body.startsWith('\uFEFFid;fecha;nombre;apellido')).toBe(true);
      expect(body).toContain(";'+58 412 000 0000;");
      expect(body).toContain('tecnologia; donaciones');
      expect(body).toContain('"\'=HYPERLINK(""x"")"');
    });

    it('PATCH cambia estado y notas; DELETE responde 204; 404 si no existe', async () => {
      const token = await login();
      await request(server())
        .patch(`/api/admin/volunteers/${ID}`)
        .set('Authorization', token)
        .send({ status: 'activo', notes: ' Llamar el lunes ' })
        .expect(200);
      expect(prisma.volunteer.update.mock.calls[0][0].data).toEqual({
        status: 'activo',
        notes: 'Llamar el lunes',
      });
      await request(server()).patch(`/api/admin/volunteers/${ID}`).set('Authorization', token).send({}).expect(400);
      await request(server()).delete(`/api/admin/volunteers/${ID}`).set('Authorization', token).expect(204);
      prisma.volunteer.delete.mockRejectedValue({ code: 'P2025' });
      await request(server()).delete(`/api/admin/volunteers/${ID}`).set('Authorization', token).expect(404);
    });

    it('GET /stats incluye total y nuevos voluntarios', async () => {
      const token = await login();
      prisma.volunteer.count.mockResolvedValueOnce(7).mockResolvedValueOnce(3);
      const res = await request(server()).get('/api/admin/stats').set('Authorization', token).expect(200);
      expect(res.body).toMatchObject({ voluntariosTotal: 7, voluntariosNuevos: 3 });
    });
  });

  describe('admin: ruleta', () => {
    it('sube varias imágenes válidas', async () => {
      const token = await login();
      const res = await request(server())
        .post('/api/admin/roulette-images')
        .set('Authorization', token)
        .attach('files', png, { filename: 'uno.png', contentType: 'image/png' })
        .attach('files', png, { filename: 'dos.png', contentType: 'image/png' })
        .expect(201);
      expect(supabase.upload).toHaveBeenCalledTimes(2);
      expect(supabase.upload.mock.calls[0][0]).toBe('roulette');
      expect(prisma.rouletteImage.create).toHaveBeenCalledTimes(2);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rechaza un archivo que finge ser imagen sin subir nada', async () => {
      const token = await login();
      const res = await request(server())
        .post('/api/admin/roulette-images')
        .set('Authorization', token)
        .attach('files', Buffer.from('no soy una imagen'), { filename: 'falso.png', contentType: 'image/png' })
        .expect(400);
      expect(res.body.message).toMatch(/contenido/i);
      expect(supabase.upload).not.toHaveBeenCalled();
    });

    it('rechaza archivos de más de 5 MB con un mensaje en español', async () => {
      const token = await login();
      const big = Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]);
      const res = await request(server())
        .post('/api/admin/roulette-images')
        .set('Authorization', token)
        .attach('files', big, { filename: 'grande.png', contentType: 'image/png' })
        .expect(413);
      expect(res.body.message).toBe('El archivo supera el tamaño máximo permitido.');
    });

    it('exige al menos un archivo', async () => {
      const token = await login();
      await request(server()).post('/api/admin/roulette-images').set('Authorization', token).expect(400);
    });

    it('PATCH activa/desactiva y DELETE borra también el archivo de Storage', async () => {
      const token = await login();
      await request(server()).patch(`/api/admin/roulette-images/${ID}`).set('Authorization', token).send({ active: false }).expect(200);
      expect(prisma.rouletteImage.update).toHaveBeenCalledWith({ where: { id: ID }, data: { active: false } });
      await request(server()).delete(`/api/admin/roulette-images/${ID}`).set('Authorization', token).expect(204);
      expect(supabase.remove).toHaveBeenCalledWith('roulette', 'x.png');
      expect(prisma.rouletteImage.delete).toHaveBeenCalled();
    });
  });

  describe('admin: aliados', () => {
    it('crea un aliado con logo, nombre y website_url', async () => {
      const token = await login();
      const res = await request(server())
        .post('/api/admin/allies')
        .set('Authorization', token)
        .field('name', 'Fundación Luz')
        .field('website_url', 'https://luz.org')
        .attach('logo', png, { filename: 'logo.png', contentType: 'image/png' })
        .expect(201);
      expect(supabase.upload.mock.calls[0][0]).toBe('allies');
      expect(prisma.ally.create.mock.calls[0][0].data).toMatchObject({
        name: 'Fundación Luz',
        websiteUrl: 'https://luz.org',
        position: 3,
        active: true,
      });
      expect(res.body.name).toBe('Fundación Luz');
    });

    it('rechaza website_url sin http(s) y no sube el logo', async () => {
      const token = await login();
      const res = await request(server())
        .post('/api/admin/allies')
        .set('Authorization', token)
        .field('name', 'X')
        .field('website_url', 'javascript:alert(1)')
        .attach('logo', png, { filename: 'logo.png', contentType: 'image/png' })
        .expect(400);
      expect(res.body.message[0]).toContain('http://');
      expect(supabase.upload).not.toHaveBeenCalled();
    });

    it('rechaza logos de más de 2 MB', async () => {
      const token = await login();
      const big = Buffer.concat([png, Buffer.alloc(2 * 1024 * 1024)]);
      await request(server())
        .post('/api/admin/allies')
        .set('Authorization', token)
        .field('name', 'X')
        .field('website_url', 'https://x.org')
        .attach('logo', big, { filename: 'logo.png', contentType: 'image/png' })
        .expect(413);
    });

    it('PATCH edita campos (JSON) y reemplaza el logo (multipart) borrando el anterior', async () => {
      const token = await login();
      await request(server())
        .patch(`/api/admin/allies/${ID}`)
        .set('Authorization', token)
        .send({ name: 'Nuevo', position: 1, active: false })
        .expect(200);
      expect(prisma.ally.update.mock.calls[0][0].data).toEqual({ name: 'Nuevo', position: 1, active: false });

      await request(server())
        .patch(`/api/admin/allies/${ID}`)
        .set('Authorization', token)
        .field('active', 'true')
        .attach('logo', png, { filename: 'nuevo.png', contentType: 'image/png' })
        .expect(200);
      expect(supabase.remove).toHaveBeenCalledWith('allies', 'l.png');
    });

    it('DELETE borra el logo de Storage y el registro', async () => {
      const token = await login();
      await request(server()).delete(`/api/admin/allies/${ID}`).set('Authorization', token).expect(204);
      expect(supabase.remove).toHaveBeenCalledWith('allies', 'l.png');
    });
  });
});
