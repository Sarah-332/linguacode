'use client';

import DeleteButton from './DeleteButton';

interface Review {
  id: string;
  originalCode: string;
  refactoredCode?: string;
  target: string;
  language: string;
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({ review, onDelete }: ReviewCardProps) {
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(review.originalCode);
      alert('Original code copied to clipboard.');
    } catch {
      alert('Failed to copy.');
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/review/${review.id}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Review link copied to clipboard.');
    } catch {
      alert('Failed to copy link.');
    }
  };

  return (
    <div
      id={`review-${review.id}`}
      className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm hover:shadow-md transition relative"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
            <span>
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                review.target === 'faang'
                  ? 'bg-indigo-900 text-indigo-200'
                  : review.target === 'opensource'
                  ? 'bg-green-900 text-green-200'
                  : review.target === 'microsoft'
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-yellow-900 text-yellow-200'
              }`}
            >
              {review.target}
            </span>
            <span className="inline-block px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
              {review.language}
            </span>
          </div>

          <pre className="mt-2 text-sm font-mono bg-slate-900 p-3 rounded-lg overflow-hidden text-slate-200 line-clamp-3">
            {review.originalCode}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={copyCode}
            className="px-3 py-1 text-xs rounded font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
          >
            📋 Copy
          </button>
          <button
            onClick={copyLink}
            className="px-3 py-1 text-xs rounded font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
          >
            🔗 Link
          </button>
          <DeleteButton reviewId={review.id} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}