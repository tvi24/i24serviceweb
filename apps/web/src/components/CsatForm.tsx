import { Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui';

export function CsatForm({ onSubmit, busy }: { onSubmit: (rating: number, comment?: string) => void; busy?: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating from 1 to 5.');
      return;
    }
    setError(null);
    onSubmit(rating, comment.trim() || undefined);
  }

  return (
    <div className="stack">
      <div className="row" role="radiogroup" aria-label="Satisfaction rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          >
            <Star size={28} fill={(hover || rating) >= n ? 'var(--color-warning)' : 'none'} color="var(--color-warning)" />
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="csat-comment">Comment (optional)</label>
        <textarea id="csat-comment" className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {error && <span className="field__error" role="alert">{error}</span>}
      <Button onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit rating'}</Button>
    </div>
  );
}
