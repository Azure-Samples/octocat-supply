/**
 * @swagger
 * components:
 *   schemas:
 *     ProductReview:
 *       type: object
 *       required:
 *         - reviewId
 *         - productId
 *         - reviewerName
 *         - rating
 *       properties:
 *         reviewId:
 *           type: integer
 *           description: The unique identifier for the review
 *         productId:
 *           type: integer
 *           description: The ID of the reviewed product
 *         reviewerName:
 *           type: string
 *           description: Name of the reviewer
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5
 *         comment:
 *           type: string
 *           description: Optional review comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *     ProductReviewSummary:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *         averageRating:
 *           type: number
 *           format: float
 *         totalReviews:
 *           type: integer
 *         ratingDistribution:
 *           type: object
 *           properties:
 *             1:
 *               type: integer
 *             2:
 *               type: integer
 *             3:
 *               type: integer
 *             4:
 *               type: integer
 *             5:
 *               type: integer
 */
export interface ProductReview {
  reviewId: number;
  productId: number;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProductReviewSummary {
  productId: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}
