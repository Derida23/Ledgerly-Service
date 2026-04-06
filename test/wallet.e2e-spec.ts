import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, setTestUser } from './test-helpers';

describe('Wallets (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    setTestUser('ADMIN');
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  describe('POST /api/wallets', () => {
    it('should create a wallet', () => {
      return request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'Bank BCA', initialBalance: 5000000 })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Bank BCA');
          expect(res.body.id).toBeDefined();
        });
    });

    it('should reject duplicate wallet name', async () => {
      await request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'Bank BCA' })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'Bank BCA' })
        .expect(409);
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: '' })
        .expect(400);
    });

    it('should reject VIEWER role', () => {
      setTestUser('VIEWER');
      return request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'Bank BCA' })
        .expect(403);
    });
  });

  describe('GET /api/wallets', () => {
    it('should return empty array', () => {
      return request(app.getHttpServer())
        .get('/api/wallets')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('should return wallets with balance', async () => {
      await request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'BCA', initialBalance: 5000000 });

      return request(app.getHttpServer())
        .get('/api/wallets')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].name).toBe('BCA');
          expect(res.body[0].balance).toBe(5000000);
        });
    });

    it('should allow VIEWER role', () => {
      setTestUser('VIEWER');
      return request(app.getHttpServer()).get('/api/wallets').expect(200);
    });
  });

  describe('GET /api/wallets/:id', () => {
    it('should return 404 for non-existent wallet', () => {
      return request(app.getHttpServer())
        .get('/api/wallets/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/wallets/:id', () => {
    it('should update wallet name', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'Old Name' });

      return request(app.getHttpServer())
        .patch(`/api/wallets/${create.body.id}`)
        .send({ name: 'New Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('New Name');
        });
    });
  });

  describe('DELETE /api/wallets/:id', () => {
    it('should delete wallet', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/wallets')
        .send({ name: 'To Delete' });

      await request(app.getHttpServer())
        .delete(`/api/wallets/${create.body.id}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/api/wallets/${create.body.id}`)
        .expect(404);
    });
  });

  describe('POST /api/wallets/seed', () => {
    it('should seed 7 default wallets', async () => {
      await request(app.getHttpServer()).post('/api/wallets/seed').expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/wallets')
        .expect(200);

      expect(res.body).toHaveLength(7);
      expect(res.body.map((w: { name: string }) => w.name)).toContain(
        'Bank Mandiri',
      );
      expect(res.body.map((w: { name: string }) => w.name)).toContain('Bibit');
    });
  });
});
