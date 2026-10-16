'use client';

import { useState } from 'react';

interface DeleteButtonProps {
  reviewId: string;
  onDelete: (reviewId: string) => void;
}

export default function DeleteButton({ reviewId, onDelete }: DeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/review/${reviewId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
        setDeleting(false);
        return;
      }
      onDelete(reviewId);
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting.');
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={`px-3 py-1 text-xs rounded font-medium transition ${
        deleting 
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
          : 'bg-red-900/40 text-red-300 hover:bg-red-900'
      }`}
    >
      {deleting ? 'Deleting…' : '🗑 Delete'}
    </button>
  );
}