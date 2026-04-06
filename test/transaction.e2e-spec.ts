import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, setTestUser } from './test-helpers';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let walletId: string;
  let walletId2: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    setTestUser('ADMIN');

    // Create test wallet + category
    const w1 = await request(app.getHttpServer())
      .post('/api/wallets')
      .send({ name: 'Mandiri', initialBalance: 10000000 });
    walletId = w1.body.id;

    const w2 = await request(app.getHttpServer())
      .post('/api/wallets')
      .send({ name: 'Jago', initialBalance: 2000000 });
    walletId2 = w2.body.id;

    const cat = await request(app.getHttpServer())
      .post('/api/categories')
      .send({ name: 'Food', icon: '🍔', type: 'EXPENSE' });
    categoryId = cat.body.id;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  describe('POST /api/transactions', () => {
    it('should create an expense', () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          amount: 50000,
          type: 'EXPENSE',
          walletId,
          categoryId,
          method: 'QRIS',
        })
        .expect(201)
        .expect((res) => {
          expect(Number(res.body.amount)).toBe(50000);
          expect(res.body.type).toBe('EXPENSE');
          expect(res.body.wallet.name).toBe('Mandiri');
          expect(res.body.category.name).toBe('Food');
        });
    });

    it('should reject expense without method', () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          amount: 50000,
          type: 'EXPENSE',
          walletId,
          categoryId,
        })
        .expect(400);
    });

    it('should create an income', () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          amount: 8500000,
          type: 'INCOME',
          walletId,
          categoryId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.type).toBe('INCOME');
          expect(res.body.method).toBeNull();
        });
    });
  });

  describe('POST /api/transactions/transfer', () => {
    it('should create 2 linked records (no admin fee)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/transactions/transfer')
        .send({
          amount: 1000000,
          sourceWalletId: walletId,
          targetWalletId: walletId2,
        })
        .expect(201);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].type).toBe('TRANSFER_OUT');
      expect(res.body[1].type).toBe('TRANSFER_IN');
      expect(res.body[0].transferPairId).toBeDefined();
    });

    it('should create 3 records with admin fee', async () => {
      // Seed categories for admin fee
      await request(app.getHttpServer()).post('/api/categories/seed');

      const res = await request(app.getHttpServer())
        .post('/api/transactions/transfer')
        .send({
          amount: 1000000,
          sourceWalletId: walletId,
          targetWalletId: walletId2,
          adminFee: 6500,
        })
        .expect(201);

      expect(res.body).toHaveLength(3);
      expect(res.body[2].type).toBe('EXPENSE');
      expect(Number(res.body[2].amount)).toBe(6500);
    });

    it('should reject same source and target wallet', () => {
      return request(app.getHttpServer())
        .post('/api/transactions/transfer')
        .send({
          amount: 1000000,
          sourceWalletId: walletId,
          targetWalletId: walletId,
        })
        .expect(400);
    });
  });

  describe('GET /api/transactions', () => {
    it('should return paginated results', async () => {
      await request(app.getHttpServer())
        .post('/api/transactions')
        .send({ amount: 50000, type: 'INCOME', walletId, categoryId });

      const res = await request(app.getHttpServer())
        .get('/api/transactions')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.page).toBe(1);
    });

    it('should filter by type', async () => {
      await request(app.getHttpServer())
        .post('/api/transactions')
        .send({ amount: 50000, type: 'INCOME', walletId, categoryId });
      await request(app.getHttpServer()).post('/api/transactions').send({
        amount: 30000,
        type: 'EXPENSE',
        walletId,
        categoryId,
        method: 'CASH',
      });

      const res = await request(app.getHttpServer())
        .get('/api/transactions?type=INCOME')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('INCOME');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete transfer pair together', async () => {
      const transfer = await request(app.getHttpServer())
        .post('/api/transactions/transfer')
        .send({
          amount: 500000,
          sourceWalletId: walletId,
          targetWalletId: walletId2,
        });

      const transferOutId = transfer.body[0].id;

      await request(app.getHttpServer())
        .delete(`/api/transactions/${transferOutId}`)
        .expect(200);

      // Both records should be gone
      const res = await request(app.getHttpServer())
        .get('/api/transactions')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });
  });
});
