import { Star } from 'lucide-react';
import { useState } from 'react';
import { useT } from '../i18n/I18nContext';
import { Button } from './ui';

export function CsatForm({ onSubmit, busy }: { onSubmit: (rating: number, comment?: string) => void; busy?: boolean }) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (rating < 1 || rating > 5) {
      setError(t('csat.error'));
      return;
    }
    setError(null);
    onSubmit(rating, comment.trim() || undefined);
  }

  return (
    <div className="stack">
      <div className="row" role="radiogroup" aria-label={t('csat.ratingAria')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={t(n > 1 ? 'csat.starAria_plural' : 'csat.starAria', { n })}
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
        <label htmlFor="csat-comment">{t('csat.comment')}</label>
        <textarea id="csat-comment" className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {error && <span className="field__error" role="alert">{error}</span>}
      <Button onClick={submit} disabled={busy}>{busy ? t('csat.submitting') : t('csat.submit')}</Button>
    </div>
  );
}
