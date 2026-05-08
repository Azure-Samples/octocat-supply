import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductReviewsRepository } from './productReviewsRepo';

// Mock the getDatabase function first
vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

describe('ProductReviewsRepository', () => {
  let repository: ProductReviewsRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      db: {},
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn(),
    };

    repository = new ProductReviewsRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findByProductId', () => {
    it('should return all reviews for a product', async () => {
      const mockResults = [
        { review_id: 1, product_id: 1, reviewer_name: 'Alice', rating: 5, comment: 'Great!', created_at: '2026-01-01' },
        { review_id: 2, product_id: 1, reviewer_name: 'Bob', rating: 4, comment: 'Good', created_at: '2026-01-02' },
      ];
      mockDb.all.mockResolvedValue(mockResults);

      const result = await repository.findByProductId(1);

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC',
        [1],
      );
      expect(result).toHaveLength(2);
      expect(result[0].reviewerName).toBe('Alice');
      expect(result[1].rating).toBe(4);
    });

    it('should return empty array when no reviews exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findByProductId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return review when found', async () => {
      mockDb.get.mockResolvedValue({
        review_id: 1,
        product_id: 1,
        reviewer_name: 'Alice',
        rating: 5,
        comment: 'Great!',
        created_at: '2026-01-01',
      });

      const result = await repository.findById(1);

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM product_reviews WHERE review_id = ?',
        [1],
      );
      expect(result?.reviewId).toBe(1);
      expect(result?.reviewerName).toBe('Alice');
    });

    it('should return null when review not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('getSummary', () => {
    it('should return review summary with rating distribution', async () => {
      mockDb.get.mockResolvedValue({ total_reviews: 3, average_rating: 4.3333 });
      mockDb.all.mockResolvedValue([
        { rating: 4, count: 1 },
        { rating: 5, count: 2 },
      ]);

      const result = await repository.getSummary(1);

      expect(result.productId).toBe(1);
      expect(result.averageRating).toBe(4.3);
      expect(result.totalReviews).toBe(3);
      expect(result.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 });
    });

    it('should return zero summary when no reviews exist', async () => {
      mockDb.get.mockResolvedValue({ total_reviews: 0, average_rating: 0 });
      mockDb.all.mockResolvedValue([]);

      const result = await repository.getSummary(999);

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a review and return it', async () => {
      const newReview = {
        productId: 1,
        reviewerName: 'Alice',
        rating: 5,
        comment: 'Excellent!',
      };

      mockDb.run.mockResolvedValue({ lastID: 1, changes: 1 });
      mockDb.get.mockResolvedValue({
        review_id: 1,
        product_id: 1,
        reviewer_name: 'Alice',
        rating: 5,
        comment: 'Excellent!',
        created_at: '2026-01-01',
      });

      const result = await repository.create(newReview);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.reviewId).toBe(1);
      expect(result.reviewerName).toBe('Alice');
    });
  });

  describe('delete', () => {
    it('should delete a review', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await repository.delete(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM product_reviews WHERE review_id = ?',
        [1],
      );
    });

    it('should throw NotFoundError when review does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.delete(999)).rejects.toThrow();
    });
  });
});
