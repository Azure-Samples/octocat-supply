/**
 * Repository for product reviews data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { ProductReview, ProductReviewSummary } from '../models/productReview';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { buildInsertSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class ProductReviewsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Get all reviews for a product
   */
  async findByProductId(productId: number): Promise<ProductReview[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC',
        [productId],
      );
      return mapDatabaseRows<ProductReview>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get a review by ID
   */
  async findById(id: number): Promise<ProductReview | null> {
    try {
      const row = await this.db.get<DatabaseRow>(
        'SELECT * FROM product_reviews WHERE review_id = ?',
        [id],
      );
      return row ? objectToCamelCase<ProductReview>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get review summary for a product (average rating, count, distribution)
   */
  async getSummary(productId: number): Promise<ProductReviewSummary> {
    try {
      const stats = await this.db.get<DatabaseRow>(
        'SELECT COUNT(*) as total_reviews, COALESCE(AVG(rating), 0) as average_rating FROM product_reviews WHERE product_id = ?',
        [productId],
      );

      const distRows = await this.db.all<DatabaseRow>(
        'SELECT rating, COUNT(*) as count FROM product_reviews WHERE product_id = ? GROUP BY rating ORDER BY rating',
        [productId],
      );

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const row of distRows) {
        ratingDistribution[row.rating as number] = row.count as number;
      }

      return {
        productId,
        averageRating: Math.round(((stats?.average_rating as number) || 0) * 10) / 10,
        totalReviews: (stats?.total_reviews as number) || 0,
        ratingDistribution,
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Create a new review
   */
  async create(review: Omit<ProductReview, 'reviewId' | 'createdAt'>): Promise<ProductReview> {
    try {
      const { sql, values } = buildInsertSQL('product_reviews', review);
      const result = await this.db.run(sql, values);

      const createdReview = await this.findById(result.lastID || 0);
      if (!createdReview) {
        throw new Error('Failed to retrieve created review');
      }

      return createdReview;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Delete a review by ID
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run(
        'DELETE FROM product_reviews WHERE review_id = ?',
        [id],
      );

      if (result.changes === 0) {
        throw new NotFoundError('ProductReview', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'ProductReview', id);
    }
  }
}

// Factory function to create repository instance
export async function createProductReviewsRepository(
  isTest: boolean = false,
): Promise<ProductReviewsRepository> {
  const db = await getDatabase(isTest);
  return new ProductReviewsRepository(db);
}

// Singleton instance for default usage
let productReviewsRepo: ProductReviewsRepository | null = null;

export async function getProductReviewsRepository(
  isTest: boolean = false,
): Promise<ProductReviewsRepository> {
  const isTestEnv = isTest || !!process.env.VITEST;
  if (isTestEnv) {
    return createProductReviewsRepository(true);
  }
  if (!productReviewsRepo) {
    productReviewsRepo = await createProductReviewsRepository(false);
  }
  return productReviewsRepo;
}
