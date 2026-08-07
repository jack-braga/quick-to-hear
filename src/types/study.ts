import { z } from 'zod';

import { ParsedTextSchema, type ParsedText } from '@/types/passage';

/**
 * The single versioned study document (PLAN §4.2). This is the stable spine the
 * whole workbook hangs off: every phase writes into one section of it, and a fresh
 * session can plug a phase in without reshaping the doc.
 *
 * `passage` (M3 / Stage 9) holds **many translations** —
 * `{ translations: Record<translationId, ParsedText>, primaryId: string | null }`. One is
 * primary (everything anchors to it); the rest are comparison-only. This restructured the
 * M1/M2 single `passage.primary`, so {@link CURRENT_SCHEMA_VERSION} bumped to 2 and
 * {@link hydrate} upgrades an old single-primary doc (see `@/lib/passage`
 * `normaliseStoredPassage`). The block/line model each reading uses lives in
 * `@/types/passage` (Stage 2). Verse IDs stay **plain strings** (tolerate a future `"1a"`;
 * build no verse-0 / letter-suffix / merged-range logic yet).
 *
 * Every field carries a default so {@link hydrate} can fill gaps when loading an old
 * or partial document. Bump {@link CURRENT_SCHEMA_VERSION} only for true restructures.
 */
export const CURRENT_SCHEMA_VERSION = 2;

export { ParsedTextSchema, type ParsedText };

// ---------------------------------------------------------------------------
// Enums / small value types
// ---------------------------------------------------------------------------

/** The six genres (SPEC Phase 1). Codes match the `content/help/phase1/` filenames. */
export const GENRES = [
  'gospels-acts',
  'ot-narrative',
  'epistles',
  'wisdom-poetry',
  'prophetic',
  'apocalyptic',
] as const;
export const GenreSchema = z.enum(GENRES);
export type Genre = z.infer<typeof GenreSchema>;

/** Format is the Phase-6 branch point (PLAN §4.9). M1 only builds `study`. */
export const FormatSchema = z.enum(['study', 'talk']);
export type Format = z.infer<typeof FormatSchema>;

/** Group composition drives application guidance + the Phase-7 gospel-plain rule. */
export const GroupCompositionSchema = z.enum([
  'believers',
  'mixed',
  'one-to-one-not-yet-christian',
]);
export type GroupComposition = z.infer<typeof GroupCompositionSchema>;

export const QuestionTypeSchema = z.enum(['context', 'observation', 'meaning', 'application']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const WeightSchema = z.enum(['light', 'medium', 'heavy']);
export type Weight = z.infer<typeof WeightSchema>;

export const AimComponentSchema = z.enum(['know', 'feel', 'do']);
export type AimComponent = z.infer<typeof AimComponentSchema>;

// ---------------------------------------------------------------------------
// Verse anchoring (PLAN §4.3) — kept minimal for M1; the picker lands in Stage 3.
// ---------------------------------------------------------------------------

/** Points at one or more verses by canonical ID (never text offsets). */
export const VerseAnchorSchema = z.object({
  verseIds: z.array(z.string()).default([]),
});
export type VerseAnchor = z.infer<typeof VerseAnchorSchema>;

// ---------------------------------------------------------------------------
// Phase 1 — Setup
// ---------------------------------------------------------------------------

export const SetupSchema = z.object({
  reference: z.string().default(''),
  // Optional study title (v2 locked decision) — defaults to the reference; becomes the
  // handout heading. Additive-optional, so v1 docs load unchanged (default '').
  title: z.string().default(''),
  genre: GenreSchema.nullable().default(null),
  format: FormatSchema.default('study'),
  durationMinutes: z.number().nullable().default(null),
  groupComposition: GroupCompositionSchema.nullable().default(null),
  seriesNote: z.string().default(''),
  introText: z.string().default(''),
  primaryTranslationId: z.string().nullable().default(null),
  secondaryTranslationIds: z.array(z.string()).default([]),
});
export type Setup = z.infer<typeof SetupSchema>;

// ---------------------------------------------------------------------------
// Phase 3 — Map (sections + question marks)
// ---------------------------------------------------------------------------

export const SectionSchema = z.object({
  id: z.string(),
  startVerseId: z.string(),
  endVerseId: z.string(),
  name: z.string().default(''),
  weight: WeightSchema.optional(),
});
export type Section = z.infer<typeof SectionSchema>;

/** A verse / phrase / word the user did not understand (SPEC Phase 3b). */
export const MarkSchema = z.object({
  id: z.string(),
  kind: z.enum(['verse', 'phrase', 'word']),
  verseId: z.string(),
  // Character offsets into the verse's NFC text for phrase/word marks; whole-verse
  // marks omit it. Degrades to whole-verse if the text later changes (PLAN §4.3).
  span: z.object({ start: z.number(), end: z.number() }).optional(),
  text: z.string().default(''),
  // The user's own note about what confuses them (v2 "Mark confusing" — SPEC Phase 3b:
  // "what confuses you here? they'll feel it too"). Additive-optional; distinct from `text`
  // (the verse/phrase snapshot). Left untouched by `reconcileMarks`.
  note: z.string().optional(),
});
export type Mark = z.infer<typeof MarkSchema>;

export const MapSchema = z.object({
  sections: z.array(SectionSchema).default([]),
  marks: z.array(MarkSchema).default([]),
});
export type StudyMap = z.infer<typeof MapSchema>;

// ---------------------------------------------------------------------------
// Phase 4 — COMA notes
// ---------------------------------------------------------------------------

export const NoteSchema = z.object({
  id: z.string(),
  text: z.string().default(''),
  anchor: VerseAnchorSchema.optional(),
});
export type Note = z.infer<typeof NoteSchema>;

export const ComaSchema = z.object({
  context: z.array(NoteSchema).default([]),
  observation: z.array(NoteSchema).default([]),
  meaning: z.array(NoteSchema).default([]),
  application: z.array(NoteSchema).default([]),
});
export type Coma = z.infer<typeof ComaSchema>;

// ---------------------------------------------------------------------------
// Phase 5 — Theme & aim
// ---------------------------------------------------------------------------

export const ThemeAimSchema = z.object({
  theme: z.string().default(''),
  authorAim: z.string().default(''),
  groupAim: z.string().default(''),
  know: z.string().default(''),
  feel: z.string().default(''),
  doField: z.string().default(''),
  christRoute: z.string().default(''),
  // Method-YAML ack ids version independently of schemaVersion, so unknown keys are
  // tolerated (records, not enums).
  litmusAcks: z.record(z.boolean()).default({}),
  trapAcks: z.record(z.boolean()).default({}),
});
export type ThemeAim = z.infer<typeof ThemeAimSchema>;

// ---------------------------------------------------------------------------
// Phase 6 — Build (discriminated on setup.format; §4.9 Talk-mode seam)
// ---------------------------------------------------------------------------

/** Recycle-forward provenance (PLAN §4.2): copy-on-promote, back-linked to source. */
export const CandidateSchema = z.object({
  id: z.string(),
  kind: z.enum(['question', 'background-box']),
  text: z.string().default(''),
  status: z.enum(['open', 'promoted', 'discarded']).default('open'),
  source: z.object({ kind: z.enum(['mark', 'comaNote']), id: z.string() }).optional(),
  questionType: QuestionTypeSchema.optional(),
  // Snapshot of the source's verse anchor, carried forward so a promoted question keeps
  // the anchor the user already chose (SPEC 4/6c). Additive-optional; absent for
  // free-typed brainstorm candidates.
  anchor: VerseAnchorSchema.optional(),
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().default(''),
  anchor: VerseAnchorSchema.default({ verseIds: [] }),
  type: QuestionTypeSchema,
  // The one enforced discipline (SPEC 6e / Principle 3): a question cannot be
  // promoted without an expected answer. The field is always present; the UI blocks
  // promotion while it is empty.
  expectedAnswer: z.string().default(''),
  weight: WeightSchema.default('medium'),
  loadBearing: z.boolean().default(false),
  gospelPlain: z.boolean().optional(),
  aimComponent: AimComponentSchema.optional(),
  wrongTurns: z.string().optional(),
  pastoralFlag: z.boolean().optional(),
  // Optional free-text note captured when the pastoral flag is set (who is in the middle
  // of this, and whether to raise it privately). Additive-optional — no schema bump.
  pastoralNote: z.string().optional(),
  sourceCandidateId: z.string().optional(),
  supportPassageIds: z.array(z.string()).optional(),
  returnQuestion: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SupportPassageSchema = z.object({
  id: z.string(),
  reference: z.string().default(''),
  type: z.enum(['context', 'quoted', 'background']),
  text: ParsedTextSchema.nullable().default(null),
  attachedToQuestionId: z.string().optional(),
  returnQuestion: z.string().optional(),
});
export type SupportPassage = z.infer<typeof SupportPassageSchema>;

export const StudyBuildSchema = z.object({
  format: z.literal('study'),
  candidates: z.array(CandidateSchema).default([]),
  questions: z.array(QuestionSchema).default([]),
  supportPassages: z.array(SupportPassageSchema).default([]),
  prayerPoint: z.string().default(''),
  order: z.array(z.string()).default([]),
});
export type StudyBuild = z.infer<typeof StudyBuildSchema>;

/** Stub only — Talk mode branches here later (SPEC §8, PLAN §4.9). Not built in M1. */
export const TalkBuildSchema = z.object({
  format: z.literal('talk'),
});
export type TalkBuild = z.infer<typeof TalkBuildSchema>;

export const BuildSchema = z.discriminatedUnion('format', [StudyBuildSchema, TalkBuildSchema]);
export type Build = z.infer<typeof BuildSchema>;

/** A fresh, empty `study`-format build. */
export function emptyStudyBuild(): StudyBuild {
  return {
    format: 'study',
    candidates: [],
    questions: [],
    supportPassages: [],
    prayerPoint: '',
    order: [],
  };
}

// ---------------------------------------------------------------------------
// Phase 7 — Audit
// ---------------------------------------------------------------------------

export const CoverageTagSchema = z.enum(['connective', 'deferred', 'needs-question']);
export type CoverageTag = z.infer<typeof CoverageTagSchema>;

export const AuditSchema = z.object({
  acks: z.record(z.boolean()).default({}),
  coverageTags: z.record(CoverageTagSchema).default({}),
});
export type Audit = z.infer<typeof AuditSchema>;

// ---------------------------------------------------------------------------
// The whole document
// ---------------------------------------------------------------------------

/**
 * The passage container (M3 / Stage 9). `translations` is keyed by `translationId`; the
 * `primaryId` names the anchor translation (everything — verses, questions, the handout —
 * points at it). Secondaries are comparison-only. An empty study has no translations and a
 * null `primaryId`. Read the primary via `@/lib/passage` `primaryText`.
 */
export const PassageSchema = z
  .object({
    translations: z.record(ParsedTextSchema).default({}),
    primaryId: z.string().nullable().default(null),
  })
  .default({ translations: {}, primaryId: null });
export type Passage = z.infer<typeof PassageSchema>;

export const StudySchema = z.object({
  schemaVersion: z.number().default(CURRENT_SCHEMA_VERSION),
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  setup: SetupSchema.default({}),
  passage: PassageSchema,
  read: z.object({ count: z.number().default(0) }).default({ count: 0 }),
  map: MapSchema.default({ sections: [], marks: [] }),
  coma: ComaSchema.default({ context: [], observation: [], meaning: [], application: [] }),
  themeAim: ThemeAimSchema.default({}),
  build: BuildSchema.default(emptyStudyBuild()),
  audit: AuditSchema.default({ acks: {}, coverageTags: {} }),
});
export type Study = z.infer<typeof StudySchema>;

/**
 * A lightweight row for the Home list — derived from the study body, never the heavy
 * passage payload. Kept in sync with {@link toSummary}.
 */
export interface StudySummary {
  id: string;
  reference: string;
  seriesNote: string;
  genre: Genre | null;
  updatedAt: string;
  createdAt: string;
  questionCount: number;
}

/** Human label for a study when no reference has been entered yet. */
export const UNTITLED_STUDY = 'Untitled study';

export function studyLabel(s: Pick<StudySummary, 'reference'>): string {
  return s.reference.trim() || UNTITLED_STUDY;
}

export function toSummary(study: Study): StudySummary {
  return {
    id: study.id,
    reference: study.setup.reference,
    seriesNote: study.setup.seriesNote,
    genre: study.setup.genre,
    updatedAt: study.updatedAt,
    createdAt: study.createdAt,
    questionCount: study.build.format === 'study' ? study.build.questions.length : 0,
  };
}

/**
 * Build a fresh, valid, empty study. Timestamps + id are supplied by the caller so
 * this stays pure (no `crypto` / `Date` here — see `src/lib/id.ts` and the store).
 */
export function makeStudy(id: string, nowIso: string): Study {
  return StudySchema.parse({ id, createdAt: nowIso, updatedAt: nowIso });
}
