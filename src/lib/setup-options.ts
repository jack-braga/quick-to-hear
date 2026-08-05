import { GENRES, type Genre, type GroupComposition } from '@/types/study';

/**
 * Display labels for the Phase-1 setup pickers. These mirror the **settled** labels in
 * `content/method/genres.yaml` (SPEC Phase 1). They live here as a small typed table so
 * Stage 2 needn't pull in the YAML method-loader yet (that lands at Stage 4.7); the YAML
 * remains the source of truth for the *prose* (reading tips etc.) it will carry.
 */
export const GENRE_LABELS: Record<Genre, string> = {
  'gospels-acts': 'Gospels and Acts',
  'ot-narrative': 'Old Testament narrative',
  epistles: 'Epistles',
  'wisdom-poetry': 'Hebrew wisdom literature and poetry',
  prophetic: 'Prophetic literature',
  apocalyptic: 'Apocalyptic literature',
};

export const GENRE_OPTIONS: { value: Genre; label: string }[] = GENRES.map((g) => ({
  value: g,
  label: GENRE_LABELS[g],
}));

/** Duration presets (minutes) — drives the Phase-6 question budget (SPEC 6b). */
export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1½ hours' },
];

export const GROUP_LABELS: Record<GroupComposition, string> = {
  believers: 'Believers',
  mixed: 'Mixed (believers and not-yet-Christians)',
  'one-to-one-not-yet-christian': 'One-to-one with a not-yet-Christian',
};

export const GROUP_OPTIONS: { value: GroupComposition; label: string }[] = (
  Object.keys(GROUP_LABELS) as GroupComposition[]
).map((v) => ({ value: v, label: GROUP_LABELS[v] }));
