import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApplication } from '../../apps/api/dist/create-application.js';

describe('I-ACC/API-compilada', () => {
  let app: Awaited<ReturnType<typeof createApplication>>;
  beforeAll(async () => { app = await createApplication(); await app.init(); });
  afterAll(async () => { await app?.close(); });
  it('responde por HTTP con Nest compilado y prefijo común', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(response.body).toEqual({ data: { service: 'almacen-api', status: 'ok' } });
  });
});
