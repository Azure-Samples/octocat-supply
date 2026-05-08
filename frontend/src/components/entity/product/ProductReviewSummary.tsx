import axios from 'axios';
import { useQuery } from 'react-query';
import { api } from '../../../api/config';
import { useTheme } from '../../../context/ThemeContext';

interface ProductReviewSummary {
  productId: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

const fetchReviewSummary = async (productId: number): Promise<ProductReviewSummary> => {
  const { data } = await axios.get(
    `${api.baseURL}${api.endpoints.productReviews}/product/${productId}/summary`,
  );
  return data;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <svg
            key={star}
            className={`w-4 h-4 ${filled ? 'text-yellow-400' : half ? 'text-yellow-300' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </span>
  );
}

function RatingBar({
  rating,
  count,
  total,
  darkMode,
}: {
  rating: number;
  count: number;
  total: number;
  darkMode: boolean;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-3 text-right ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {rating}
      </span>
      <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className={`flex-1 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className="h-2 rounded-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-6 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
        {count}
      </span>
    </div>
  );
}

export default function ProductReviewSummaryCard({ productId }: { productId: number }) {
  const { darkMode } = useTheme();
  const { data: summary, isLoading } = useQuery(
    ['reviewSummary', productId],
    () => fetchReviewSummary(productId),
    { staleTime: 60_000 },
  );

  if (isLoading) {
    return (
      <div className={`animate-pulse h-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No reviews yet</p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <StarRating rating={summary.averageRating} />
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {summary.averageRating}
        </span>
        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          ({summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>
      <div className="space-y-0.5">
        {[5, 4, 3, 2, 1].map((r) => (
          <RatingBar
            key={r}
            rating={r}
            count={summary.ratingDistribution[r] || 0}
            total={summary.totalReviews}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
}
