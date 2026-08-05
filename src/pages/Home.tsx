import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';

// Stage 0 Home: the app shell's landing route. The studies list, "new study", and
// open/delete/import land in Stage 1 (study model + storage). Keep this honest —
// no study model exists yet.
export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Prepare a Bible study</h1>
        <p className="max-w-2xl text-muted-foreground">
          A workbook that takes you from a passage reference to two printable documents — a
          participant handout and leader&rsquo;s notes. It structures, prompts, and checks your
          work; it never writes your content for you.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Not ready yet
        </h2>
        <p className="mt-2 text-sm">
          This is the app shell (Stage 0). Creating and opening studies arrives in the next stage.
        </p>
        <div className="mt-4">
          <GuidancePlaceholder helpKey="home.intro" />
        </div>
      </section>
    </div>
  );
}
