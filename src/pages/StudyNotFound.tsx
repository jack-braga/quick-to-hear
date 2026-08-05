import { Link } from 'react-router-dom';

/** Shown by a phase page while its study is loading, or when the id doesn't exist. */
export function StudyNotFound({ loading }: { loading: boolean }) {
  return (
    <p className="text-sm text-muted-foreground">
      {loading ? 'Loading…' : 'Study not found. '}
      {!loading && (
        <Link to="/" className="underline underline-offset-2">
          Back to your studies
        </Link>
      )}
    </p>
  );
}
