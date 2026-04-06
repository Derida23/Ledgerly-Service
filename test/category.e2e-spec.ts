import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, setTestUser } from './test-helpers';

describe('Categories (e2e)', () => {
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

  describe('POST /api/categories', () => {
    it('should create a category', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Custom', icon: '⭐', type: 'EXPENSE' })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Custom');
          expect(res.body.icon).toBe('⭐');
          expect(res.body.type).toBe('EXPENSE');
        });
    });

    it('should reject duplicate category', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Food', icon: '🍔', type: 'EXPENSE' });

      return request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Food', icon: '🍕', type: 'EXPENSE' })
        .expect(409);
    });

    it('should allow same name different type', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Lainnya', icon: '📌', type: 'EXPENSE' });

      return request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Lainnya', icon: '📌', type: 'INCOME' })
        .expect(201);
    });
  });

  describe('GET /api/categories', () => {
    it('should filter by type', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Food', icon: '🍔', type: 'EXPENSE' });
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Salary', icon: '💰', type: 'INCOME' });

      const res = await request(app.getHttpServer())
        .get('/api/categories?type=EXPENSE')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].type).toBe('EXPENSE');
    });
  });

  describe('POST /api/categories/seed', () => {
    it('should seed 14 default categories', async () => {
      await request(app.getHttpServer())
        .post('/api/categories/seed')
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      expect(res.body).toHaveLength(14);
    });

    it('should be idempotent', async () => {
      await request(app.getHttpServer()).post('/api/categories/seed');
      await request(app.getHttpServer()).post('/api/categories/seed');

      const res = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      expect(res.body).toHaveLength(14);
    });
  });
});
