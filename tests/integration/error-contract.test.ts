import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpFixtureModule } from '../.compiled/http.module.js';
import { configureApplication } from '../../apps/api/dist/create-application.js';

describe('I-ACC/error-contract', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [HttpFixtureModule] }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();
  });
  afterAll(async () => { await app?.close(); });

  it.each([{}, { quantity: null }, { quantity: 'Infinity' }, { quantity: 'NaN' }, { quantity: true }, { quantity: '12', role: 'admin' }])('rechaza entrada inválida %j', async body => {
    const response = await request(app.getHttpServer()).post('/api/v1/probe/quantity').send(body).expect(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toBe('Revisa los datos enviados.');
    expect(response.body.error.details.length).toBeGreaterThan(0);
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('conserva una cantidad exacta válida', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/probe/quantity').send({ quantity: '9007199254740993123.25' }).expect(201);
    expect(response.body).toEqual({ data: { quantity: '9007199254740993123.25' } });
  });

  it.each([
    ['unauthorized', 401, 'SESSION_INVALID', 'Inicia sesión para continuar.'],
    ['forbidden', 403, 'FORBIDDEN', 'No tienes permiso para realizar esta acción.'],
    ['conflict', 409, 'CONFLICT', 'La operación entra en conflicto con el estado actual.'],
    ['missing', 404, 'NOT_FOUND', 'No se encontró el recurso solicitado.'],
    ['internal', 500, 'INTERNAL_ERROR', 'No se pudo completar la solicitud.'],
  ] as const)('uniforma el rechazo %s', async (route, status, code, message) => {
    const response = await request(app.getHttpServer()).get(`/api/v1/probe/${route}`).expect(status);
    expect(response.body).toEqual({ error: { code, message, details: [], requestId: expect.any(String) } });
    expect(response.body.error.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    expect(JSON.stringify(response.body)).not.toContain('Internal');
  });

  it('uniforma el JSON mal formado sin devolver el cuerpo enviado', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/probe/quantity').set('Content-Type', 'application/json').send('{invalid').expect(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.details).toEqual([]);
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });
});
