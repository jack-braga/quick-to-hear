export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-desk px-6 text-center text-ink">
      <div>
        <h1 className="font-scripture text-[32px]">Not found</h1>
        <p className="mt-2 text-[14px] text-ink-soft">That page isn’t here.</p>
        <a
          href="#/"
          className="mt-6 inline-block rounded-lg bg-lapis px-4 py-2 font-sans text-[14px] font-medium text-white hover:opacity-90 dark:text-[#10131a]"
        >
          ← Back to your studies
        </a>
      </div>
    </div>
  );
}
