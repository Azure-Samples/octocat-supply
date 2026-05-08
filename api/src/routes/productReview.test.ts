import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productReviewRouter from './productReview';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Product Review API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Seed required FK data: supplier + product
    const db = await getDatabase();
    await db.run(
      "INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?)",
      [1, 'Test Supplier', 'Test', 'John', 'john@test.com', '555-0001'],
    );
    await db.run(
      "INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [1, 1, 'Test Product', 'A test product', 9.99, 'TST-001', 'piece', 'test.png'],
    );

    app = express();
    app.use(express.json());
    app.use('/product-reviews', productReviewRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new review', async () => {
    const newReview = {
      productId: 1,
      reviewerName: 'TestUser',
      rating: 5,
      comment: 'Excellent product!',
    };
    const response = await request(app).post('/product-reviews').send(newReview);
    expect(response.status).toBe(201);
    expect(response.body.reviewerName).toBe('TestUser');
    expect(response.body.rating).toBe(5);
    expect(response.body.reviewId).toBeDefined();
  });

  it('should reject review with invalid rating', async () => {
    const badReview = {
      productId: 1,
      reviewerName: 'TestUser',
      rating: 6,
    };
    const response = await request(app).post('/product-reviews').send(badReview);
    expect(response.status).toBe(400);
  });

  it('should reject review with missing required fields', async () => {
    const response = await request(app).post('/product-reviews').send({ rating: 3 });
    expect(response.status).toBe(400);
  });

  it('should get reviews for a product', async () => {
    // Create a review first
    await request(app).post('/product-reviews').send({
      productId: 1,
      reviewerName: 'Alice',
      rating: 4,
      comment: 'Good',
    });

    const response = await request(app).get('/product-reviews/product/1');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].reviewerName).toBe('Alice');
  });

  it('should get review summary for a product', async () => {
    await request(app).post('/product-reviews').send({
      productId: 1,
      reviewerName: 'Alice',
      rating: 5,
    });
    await request(app).post('/product-reviews').send({
      productId: 1,
      reviewerName: 'Bob',
      rating: 3,
    });

    const response = await request(app).get('/product-reviews/product/1/summary');
    expect(response.status).toBe(200);
    expect(response.body.productId).toBe(1);
    expect(response.body.totalReviews).toBe(2);
    expect(response.body.averageRating).toBe(4);
    expect(response.body.ratingDistribution).toBeDefined();
    expect(response.body.ratingDistribution[5]).toBe(1);
    expect(response.body.ratingDistribution[3]).toBe(1);
  });

  it('should delete a review', async () => {
    const createResponse = await request(app).post('/product-reviews').send({
      productId: 1,
      reviewerName: 'Alice',
      rating: 5,
    });
    const reviewId = createResponse.body.reviewId;

    const response = await request(app).delete(`/product-reviews/${reviewId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 for deleting non-existing review', async () => {
    const response = await request(app).delete('/product-reviews/999');
    expect(response.status).toBe(404);
  });
});
