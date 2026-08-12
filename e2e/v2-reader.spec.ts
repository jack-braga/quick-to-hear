import { expect, test } from '@playwright/test';

// v2 acceptance (ROADMAP-v2 v2.2): the reader renders the real passage from the store,
// selection → Mark persists, and marks survive a reload. Drives the production preview.
test('v2 reader: load a passage, mark a verse, and it survives a reload', async ({ page }) => {
  await page.goto('./');

  // v2 Home is the default app at the root.
  await expect(page.getByRole('heading', { name: /prepare a bible study/i })).toBeVisible();

  await page.getByRole('button', { name: /new study/i }).click();

  // The Set-up engine: enter a reference, import a bundled translation, read the passage.
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  // Set-up now lands on Read; step across to Map for the interactive work.
  await page.getByRole('button', { name: '03 Survey' }).click();

  // The Map lens renders the real verses.
  const verse8 = page.locator('[data-v="LUKE.1.8"]');
  await expect(verse8).toBeVisible();

  // Select a verse and mark it confusing.
  await verse8.click();
  await page.getByRole('button', { name: /mark confusing/i }).click();

  // The margin shows a verse-anchored card.
  await expect(page.getByRole('button', { name: 'Luke 1:8', exact: true })).toBeVisible();

  // Persist (autosave debounce), reload, and confirm the mark survived.
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Luke 1:8', exact: true })).toBeVisible();
});

test('v2 Read + COMA lenses: the read counter persists, and COMA shows genre prompts + Helm attribution', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toBeVisible();

  // Read lens — the pray-and-read counter, an enforceable discipline paper can't do.
  await page.getByRole('button', { name: '02 Read' }).click();
  // Genre (inferred: gospels-acts) drives the reading tip.
  await expect(page.getByText(/how the writer wants you to see Jesus/i)).toBeVisible();
  // Count starts at 0 → the plural label; one tap flips it to the singular "time read".
  await expect(page.getByText('times read')).toBeVisible();
  await page.getByRole('button', { name: /I’ve read it/ }).click();
  await expect(page.getByText('time read', { exact: true })).toBeVisible();

  // The count survives a reload (autosaved with the study body).
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByRole('button', { name: '02 Read' }).click();
  await expect(page.getByText('time read', { exact: true })).toBeVisible();

  // COMA lens — the verbatim genre prompts + the required on-screen Helm attribution (rule 8).
  await page.getByRole('button', { name: '04 COMA' }).click();
  await expect(page.getByText(/What has happened so far in the narrative/i)).toBeVisible();
  await expect(page.getByText(/David Helm.*used by permission/i)).toBeVisible();
});

test('v2 COMA answer-cards: ✎ Answer spawns a card that flows into the Questions panel', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '04 COMA' }).click();

  // Answer-on-demand: ✎ Answer a prompt → an answer-card (⌖ anchor) + the prompt keeps "answer again".
  await page.getByRole('button', { name: /✎ Answer/ }).first().click();
  await expect(page.getByRole('button', { name: /answer again/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /⌖ anchor/ })).toBeVisible();

  // The answer-card is an origin-COMA annotation → it shows in the Questions panel with a
  // COMA · Context tag and the recycle-forward "→ make a question".
  await page.getByRole('button', { name: '08 Write' }).click();
  await expect(page.getByText(/COMA · Context/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /make a question/i })).toBeVisible();
});

test('v2 set-up: paste-and-clean lands a passage', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.getByRole('button', { name: /paste your own/i }).click();

  await page.fill(
    '#v2-paste',
    [
      'Psalm 23',
      'American Standard Version',
      'A Psalm of David.',
      '1 Jehovah is my shepherd;',
      '    I shall not want.',
      '2 He maketh me to lie down in green pastures;',
      '    He leadeth me beside still waters.',
      'Read full chapter',
    ].join('\n'),
  );
  await page.getByRole('button', { name: /tidy it up/i }).click();
  await page.getByRole('button', { name: /accept as the passage/i }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // The pasted text becomes the real passage and renders in the Map lens.
  await expect(page.locator('[data-v="PS.23.1"]')).toBeVisible();
  await expect(page.getByText(/Jehovah is my shepherd/i)).toBeVisible();
});

test('v2 annotations: a question tracks its expected answer (SPEC 6e) and persists', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();

  // Select a verse and add a Question from the action bar (authoring lives in the Questions lens).
  await page.locator('[data-v="LUKE.1.10"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();

  // The one enforced discipline: it needs an expected answer before it's promotable.
  await expect(page.getByText(/needs answer/i)).toBeVisible();
  await page.fill('input[placeholder^="Expected answer"]', 'They prayed outside while incense was offered.');
  await expect(page.getByText(/^ready$/i)).toBeVisible();

  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Luke 1:10', exact: true })).toBeVisible();
  await expect(page.locator('input[placeholder^="Expected answer"]')).toHaveValue(
    'They prayed outside while incense was offered.',
  );
});

test('v2 anchor capture: click a card’s chip, pick a verse, and it anchors (persists)', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  // Add an unanchored note from the panel — it starts with a dashed "⌖ anchor" chip (no verse).
  const panel = page.locator('aside');
  await panel.getByRole('button', { name: /note/i }).click();
  const anchorChip = panel.getByRole('button', { name: /anchor/i });
  await expect(anchorChip).toBeVisible();

  // Click the chip → capture starts (a hint banner over the passage); pick a verse → it anchors.
  await anchorChip.click();
  await expect(page.getByText(/Anchoring/)).toBeVisible();
  await page.locator('[data-v="LUKE.1.9"]').click();
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByRole('button', { name: 'Luke 1:9', exact: true })).toBeVisible();

  // The anchor survives a reload.
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Luke 1:9', exact: true })).toBeVisible();
});

test('v2 Questions lens: recycle-forward turns a prior note into a question at its anchor', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Make a note in the Map lens, anchored to v8.
  await page.getByRole('button', { name: '03 Survey' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /note/i }).click();

  // In the Questions lens the note carries "→ make a question"; clicking it seeds a question at v8.
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.getByRole('button', { name: /make a question/i }).click();

  // The new (empty) question needs an expected answer, and now two cards anchor to Luke 1:8.
  await expect(page.getByText(/needs answer/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Luke 1:8', exact: true })).toHaveCount(2);
});

test('v2 Read lens is pure reading: annotation tones are suppressed on the passage', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Mark a verse in Map → v8 paints a (rubric) tone on the passage.
  await page.getByRole('button', { name: '03 Survey' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /mark confusing/i }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toHaveClass(/rubric-wash/);

  // In the Read lens the same verse carries no tone — pure reading.
  await page.getByRole('button', { name: '02 Read' }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).not.toHaveClass(/rubric-wash/);
});

test('v2.5 reading modes: the Manuscript toggle persists, and sections show in every mode', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toBeVisible();

  // Reading mode lives in the Aa Text menu now; sections show in every mode (owner call).
  const openText = () => page.getByRole('button', { name: /Aa Text/ }).click();
  await openText();
  await expect(page.getByRole('button', { name: 'Formatted' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', { name: 'Section name' })).toBeVisible();

  await page.getByRole('button', { name: 'Manuscript' }).click();
  await expect(page.getByRole('button', { name: 'Manuscript' })).toHaveAttribute('aria-pressed', 'true');
  // The section band is still there in Manuscript, and the verse stays selectable.
  await expect(page.getByRole('textbox', { name: 'Section name' })).toBeVisible();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toBeVisible();

  // The choice persists across a reload (a global display preference).
  await page.waitForTimeout(1000); // let the study autosave before reloading
  await page.reload();
  await openText();
  await expect(page.getByRole('button', { name: 'Manuscript' })).toHaveAttribute('aria-pressed', 'true');

  // Back to Formatted round-trips.
  await page.getByRole('button', { name: 'Formatted' }).click();
  await expect(page.getByRole('button', { name: 'Formatted' })).toHaveAttribute('aria-pressed', 'true');
});

test('v2 parallel translations: tick a second to view side by side (every column clickable), swap the main', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  // One translation → single view: exactly one cell per verse.
  await expect(page.locator('[data-v="LUKE.1.8"]')).toHaveCount(1);

  // Add ASV from the Aa Text menu — it auto-views, so two columns appear (parallel, no switch).
  const openText = () => page.getByRole('button', { name: /Aa Text/ }).click();
  await openText();
  await page.getByRole('button', { name: /Add American Standard/i }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toHaveCount(2);
  await expect(page.getByText(/course of Abijah/i)).toBeVisible(); // ASV's distinct wording (v5)
  await page.keyboard.press('Escape'); // close the menu

  // Cross-column hover: hovering a verse in one column lights that verse in both (neutral sel wash).
  await page.locator('[data-v="LUKE.1.6"]').first().hover();
  await expect(page.locator('[data-v="LUKE.1.6"]').nth(1)).toHaveClass(/sel-wash/);

  // Every column is clickable now — click the ASV (second) column's verse → the action bar.
  await page.locator('[data-v="LUKE.1.8"]').nth(1).click();
  await expect(page.getByRole('toolbar', { name: /selected verses/i })).toBeVisible();
  await page.keyboard.press('Escape');

  // Swap the main (★) to ASV → columns swap, both stay in view (still two columns).
  await openText();
  await page.getByRole('button', { name: /Make ASV the main/i }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toHaveCount(2);
});

test('v2 parallel sectioning: divide the passage on the primary column while parallel', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  // Go parallel by adding ASV from the Aa Text menu.
  await page.getByRole('button', { name: /Aa Text/ }).click();
  await page.getByRole('button', { name: /Add American Standard/i }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-v="LUKE.1.8"]')).toHaveCount(2);

  // One full-width band to start; hover the primary v11 cell → its "＋ divide here" splits above it.
  await expect(page.getByRole('button', { name: 'Luke 1:5–25' })).toBeVisible();
  const primaryV11 = page.locator('[data-v="LUKE.1.11"]').first();
  await primaryV11.hover();
  await primaryV11.getByRole('button', { name: /Divide into a new section/i }).click();

  // Two bands now, split at v11 (sectioning works on the primary column in parallel).
  await expect(page.getByRole('button', { name: 'Luke 1:5–10' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Luke 1:11–25' })).toBeVisible();
});

test('v2 command palette (slimmed, #7): quick-jump to a verse', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toBeVisible();

  // The palette is now jump-only: type a verse number and it scrolls there. The old
  // switch-translation / create / go-lens commands were retired (dedicated UI now).
  await page.getByRole('button', { name: /\/ command/ }).click();
  await page.getByRole('dialog', { name: /command palette/i }).getByRole('textbox').fill(':20');
  await page.getByRole('button', { name: /jump to verse 20/i }).click();
  await expect(page.locator('[data-v="LUKE.1.20"]')).toBeInViewport();
});

test('v2 @mention cross-ref collapse: chip → peek → include-for-group → prints as a support passage', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  // A note anchored to v17, with an inline @-mention of another passage.
  await page.locator('[data-v="LUKE.1.17"]').click();
  await page.getByRole('toolbar', { name: /selected verses/i }).getByRole('button', { name: /note/i }).click();
  const editor = page.locator('[data-mention-editor]');
  await editor.click();
  await editor.pressSequentially('cf. @Malachi 4:5-6 fulfils this.');

  // The reference becomes an inline chip inside the note (typed char-by-char above).
  const chip = page.locator('[data-raw="@Malachi 4:5-6"]');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText(/Mal 4:5/);
  // Prep-only by default — nothing to promote, no standalone card.
  await expect(chip).toHaveAttribute('data-included', 'false');

  // Click it → the peek loads the referenced passage; the toggle lives inline on the mention.
  await chip.click();
  await expect(page.getByText(/send you Elijah the prophet/i)).toBeVisible();
  await page.getByRole('button', { name: /include for the group/i }).click();
  // Now the chip reads as "printed" (no separate Support-passage card exists anymore).
  await expect(chip).toHaveAttribute('data-included', 'true');
  await expect(page.getByText('Support passage')).toHaveCount(0);

  // It reaches the participant handout as a box (reference + fetched passage text).
  await page.waitForTimeout(1000);
  const id = page.url().match(/study\/([^/]+)\//)![1];
  await page.goto(`./#/print/${id}/handout`);
  await expect(page.getByText(/Malachi 4:5/)).toBeVisible();
  await expect(page.getByText(/send you Elijah the prophet/i)).toBeVisible();
});

test('v2 @mention autocomplete: @book → chapter → verse dropdowns build the reference', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  await page.locator('[data-v="LUKE.1.17"]').click();
  await page.getByRole('toolbar', { name: /selected verses/i }).getByRole('button', { name: /note/i }).click();
  const editor = page.locator('[data-mention-editor]');
  await editor.click();
  await editor.pressSequentially('see @mal');

  const suggest = page.getByTestId('mention-suggest');
  // 1) Book list — Enter accepts Malachi → "@Malachi ".
  await expect(suggest).toHaveAttribute('data-mode', 'book');
  await expect(suggest.getByRole('option', { name: /Malachi/ })).toBeVisible();
  await page.keyboard.press('Enter');

  // 2) Chapter grid, versification-aware: Malachi has 4 chapters (no 5th).
  await expect(suggest).toHaveAttribute('data-mode', 'chapter');
  await expect(suggest.getByRole('option', { name: '5', exact: true })).toHaveCount(0);
  await suggest.getByRole('option', { name: '4', exact: true }).click();

  // 3) Verse grid: Malachi 4 has 6 verses (no 7th). Pick v5 → the chip forms.
  await expect(suggest).toHaveAttribute('data-mode', 'verse');
  await expect(suggest.getByRole('option', { name: '7', exact: true })).toHaveCount(0);
  await suggest.getByRole('option', { name: '5', exact: true }).click();

  const chip = page.locator('[data-raw="@Malachi 4:5"]');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText(/Mal 4:5/);
});

test('v2 Theme & aim: the "Sharpen it" tools surface litmus, the four traps, and Goldsworthy (§3)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: /theme & aim/i }).click();

  // Test-your-theme litmus opens on demand.
  await page.getByRole('button', { name: /Test your theme/i }).click();
  await expect(page.getByText(/Would the author recognise your theme/i)).toBeVisible();

  // The four Goldsworthy traps, with the required in-app attribution (Inviolable rule 8).
  await page.getByRole('button', { name: /Watch for the four traps/i }).click();
  await expect(page.getByText('Moralism.')).toBeVisible();
  await expect(page.getByText('Flattening.')).toBeVisible();
  await expect(page.getByText(/Goldsworthy, Preaching the Whole Bible/i)).toBeVisible();

  // A trap can be acknowledged (ticked) and it persists in the theme model.
  const moralism = page.getByRole('checkbox').first();
  await moralism.check();
  await expect(moralism).toBeChecked();
});

test('v2 Questions lens: a yes-or-no opener surfaces the soft question-craft warning (§3)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();

  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar', { name: /selected verses/i }).getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('Is Zechariah faithful?');

  // Soft warning (advisory, never a block) — text authored in warnings.yaml, detection in detectWarnings.
  await expect(page.getByText(/may be a yes-or-no question/i)).toBeVisible();

  // Rewording to an open question clears it.
  await page.locator('textarea[data-focus]').fill('What does Zechariah’s service show about him?');
  await expect(page.getByText(/may be a yes-or-no question/i)).toHaveCount(0);
});

test('v2 @mention: typing @Book Chapter is held (not chipped) until you finish the reference', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  await page.getByRole('button', { name: '＋ note' }).click();
  const editor = page.locator('[data-mention-editor]');
  await editor.click();
  await editor.pressSequentially('see @Luke 1');

  // '@Luke 1' must NOT grab the whole chapter mid-type — it's held as pending, editable text.
  await expect(editor.locator('[data-raw]')).toHaveCount(0);
  await expect(editor.locator('[data-pending]')).toHaveText('@Luke 1');

  await editor.pressSequentially(':5');
  await expect(editor.locator('[data-raw]')).toHaveCount(0); // still pending
  // A space after the complete reference commits it to a chip.
  await editor.pressSequentially(' done');
  await expect(editor.locator('[data-raw="@Luke 1:5"]')).toBeVisible();
});

test('v2 Questions lens: start a question from a scaffolded formula (§3)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();

  await page.getByRole('button', { name: /from a formula/i }).click();
  await expect(page.getByText('Start from a formula')).toBeVisible();
  await page.getByRole('button', { name: /Count or list/ }).click();

  // The formula seeds a new question with its scaffolded stem (blanks for the leader to fill).
  await expect(page.locator('textarea[data-focus]')).toHaveValue(/List every place .* appears/i);
  // The picker closes after picking.
  await expect(page.getByText('Start from a formula')).toHaveCount(0);
});

test('v2 Build lens: questions order by verse, reorder, and persist', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();

  const addQuestion = async (v: string) => {
    await page.locator(`[data-v="${v}"]`).click();
    await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  };
  // Created out of verse order (13 then 8).
  await addQuestion('LUKE.1.13');
  await addQuestion('LUKE.1.8');

  const buildLens = () => page.getByRole('button', { name: /build/i }).click();
  await buildLens();

  // Default is verse order → v8 first.
  await expect(page.locator('ol > li').first()).toContainText('Luke 1:8');

  // Nudge the first (v8) down → v13 leads.
  await page.locator('ol > li:nth-child(1) button[aria-label="Move down"]').click();
  await expect(page.locator('ol > li').first()).toContainText('Luke 1:13');

  // The running order survives a reload.
  await page.waitForTimeout(1000);
  await page.reload();
  await buildLens();
  await expect(page.locator('ol > li').first()).toContainText('Luke 1:13');
});

test('v2 exports: handout excludes answers, leader includes them', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();

  // Author one question with text + an expected answer.
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('What was his role?');
  await page.locator('input[placeholder^="Expected answer"]').fill('He served as priest.');
  await page.waitForTimeout(1000); // let autosave persist before reloading into the print route

  const id = page.url().match(/study\/([^/]+)\//)![1];

  // Participant handout — carries the question, defined by exclusion (no answer).
  await page.goto(`./#/print/${id}/handout`);
  await expect(page.getByText('What was his role?')).toBeVisible();
  await expect(page.getByText('He served as priest.')).toHaveCount(0);

  // Leader's notes — carries the expected answer.
  await page.goto(`./#/print/${id}/leader`);
  await expect(page.getByText('He served as priest.')).toBeVisible();
});

test('v2: theme & aim + set-up reach the documents, and the Check lens audits', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.fill('#v2-intro', 'A study on Gods timing.');

  await page.getByRole('button', { name: /theme & aim/i }).click();
  await page.fill('#v2-theme', 'God keeps his covenant promise.');

  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('What is Zechariah doing?');
  await page.locator('input[placeholder^="Expected answer"]').fill('Serving as priest.');

  // The Check lens runs the audit on the study.
  await page.getByRole('button', { name: /check/i }).first().click();
  await expect(page.getByText(/need a look/i)).toBeVisible();
  await expect(page.getByText(/serves the theme & aim/i)).toBeVisible();

  await page.waitForTimeout(1000);
  const id = page.url().match(/study\/([^/]+)\//)![1];

  // The leader carries the theme; the handout carries the intro.
  await page.goto(`./#/print/${id}/leader`);
  await expect(page.getByText('God keeps his covenant promise.')).toBeVisible();
  await page.goto(`./#/print/${id}/handout`);
  await expect(page.getByText('A study on Gods timing.')).toBeVisible();
});

test('v2.8 teaching help: the (i) opens the inline guidance, and "Tell me more" reveals the detail', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: /theme & aim/i }).first().click();

  // Closed by default; clicking the (i) opens the inline [I] guidance.
  await expect(page.getByRole('note')).toHaveCount(0);
  await page.getByRole('button', { name: /Guidance: Theme/i }).click();
  await expect(page.getByText(/what the passage actually claims/i)).toBeVisible();
  // The [E] detail is hidden until "Tell me more".
  await expect(page.getByText(/A topic is a word/i)).toHaveCount(0);
  await page.getByRole('button', { name: /tell me more/i }).click();
  await expect(page.getByText(/A topic is a word/i)).toBeVisible();

  // Escape closes it.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('note')).toHaveCount(0);
});

test('v2 Deepen lens: append an own-work revision to a Survey card, and it persists', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Survey: mark a verse confusing (a round-0 card).
  await page.getByRole('button', { name: '03 Survey' }).click();
  await page.locator('[data-v="LUKE.1.11"]').click();
  await page.getByRole('button', { name: /mark confusing/i }).click();

  // Deepen (round 1): the Survey card returns with its First pass; append an own-work note.
  await page.getByRole('button', { name: '05 Deepen' }).click();
  await expect(page.getByText('First pass', { exact: true })).toBeVisible();
  await expect(page.getByText('Mark · confusing')).toBeVisible();
  await page.getByRole('button', { name: /add a note/i }).click();
  await page
    .locator('[data-focus-rev]')
    .first()
    .fill('The incense hour = the people’s prayers ascending.');

  // Persist (autosave debounce), reload, and confirm the revision survived — still in Deepen.
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByRole('button', { name: '05 Deepen' }).click();
  await expect(page.locator('[data-focus-rev]').first()).toHaveValue(/incense hour/);
});

test('v2.8 attribution page: only COMA is framed as verbatim', async ({ page }) => {
  await page.goto('./#/about');
  await expect(page.getByRole('heading', { name: /Attribution & further reading/i })).toBeVisible();
  await expect(page.getByText(/Reproduced verbatim, by permission/i)).toBeVisible();
  await expect(page.getByText(/paraphrased and cited, never quoted at length/i)).toBeVisible();
});

test('v1 is archived under /v1/ and reachable', async ({ page }) => {
  await page.goto('./#/v1/');
  await expect(page.getByText(/archived v1 workbook/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /prepare a bible study/i })).toBeVisible();
});
