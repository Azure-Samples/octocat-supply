/**
 * @swagger
 * tags:
 *   name: Product Reviews
 *   description: API endpoints for managing product reviews
 */

/**
 * @swagger
 * /api/product-reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a product
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of reviews for the product
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductReview'
 *
 * /api/product-reviews/product/{productId}/summary:
 *   get:
 *     summary: Get review summary for a product
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Review summary with average rating and distribution
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductReviewSummary'
 *
 * /api/product-reviews:
 *   post:
 *     summary: Create a new product review
 *     tags: [Product Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - reviewerName
 *               - rating
 *             properties:
 *               productId:
 *                 type: integer
 *               reviewerName:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductReview'
 *       400:
 *         description: Validation error
 *
 * /api/product-reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       204:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */

import express from 'express';
import { getProductReviewsRepository } from '../repositories/productReviewsRepo';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// Get all reviews for a product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    const reviews = await repo.findByProductId(parseInt(req.params.productId));
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Get review summary for a product
router.get('/product/:productId/summary', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    const summary = await repo.getSummary(parseInt(req.params.productId));
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Create a new review
router.post('/', async (req, res, next) => {
  try {
    const { productId, reviewerName, rating, comment } = req.body;

    if (!productId || !reviewerName || rating == null) {
      throw new ValidationError('productId, reviewerName, and rating are required');
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('rating must be an integer between 1 and 5');
    }

    const repo = await getProductReviewsRepository();
    const review = await repo.create({ productId, reviewerName, rating, comment });
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

// Delete a review
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Review not found');
    } else {
      next(error);
    }
  }
});

export default router;
