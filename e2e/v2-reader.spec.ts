import { fileURLToPath } from 'node:url';

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
  await page.getByRole('toolbar').getByRole('button', { name: /confusion/i }).click();

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

test('v2 Set-up: promoting a loaded translation to primary keeps the others (never drops the old primary)', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: '+ ASV' }).click();

  // Both loaded; WEBBE is primary (added first), ASV is a removable secondary.
  await expect(page.getByRole('button', { name: /World English Bible/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /American Standard Version/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove ASV' })).toBeVisible();

  // Promote ASV → primary. WEBBE must remain (demoted to a comparison text), NOT be dropped.
  await page.getByRole('button', { name: /American Standard Version/ }).click();
  await expect(page.getByRole('button', { name: /World English Bible/ })).toBeVisible(); // still there
  await expect(page.getByRole('button', { name: 'Remove WEBBE' })).toBeVisible(); // now the removable secondary
  await expect(page.getByRole('button', { name: 'Remove ASV' })).toHaveCount(0); // ASV is the (protected) primary
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
  await panel.getByRole('button', { name: /comment/i }).click();
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
  await page.getByRole('toolbar').getByRole('button', { name: /comment/i }).click();

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
  await page.getByRole('toolbar').getByRole('button', { name: /confusion/i }).click();
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
  await page.getByRole('button', { name: /jump to a verse or reference/i }).click();
  await page.getByRole('dialog', { name: /command palette/i }).getByRole('textbox').fill(':20');
  await page.getByRole('button', { name: /jump to verse 20/i }).click();
  await expect(page.locator('[data-v="LUKE.1.20"]')).toBeInViewport();
});

test('v2 @mention include-for-group: a study note prints its reference as a support passage', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Author a study note in Write with an inline @-mention of another passage.
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.getByRole('button', { name: '＋ study note' }).click();
  const editor = page.locator('[data-mention-editor][aria-label^="Explain it for the group"]');
  await editor.click();
  await editor.pressSequentially('The Elijah promise stands behind this: cf. @Malachi 4:5-6.');

  const chip = page.locator('[data-raw="@Malachi 4:5-6"]');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute('data-included', 'false'); // prep-only by default

  // Include it for the group → the peek loads the passage; the toggle lives inline on the mention.
  await chip.click();
  await expect(page.getByText(/send you Elijah the prophet/i)).toBeVisible();
  await page.getByRole('button', { name: /include for the group/i }).click();
  await expect(chip).toHaveAttribute('data-included', 'true');

  // The participant handout prints the study note + the support passage (reference + fetched text).
  await page.waitForTimeout(1000);
  const id = page.url().match(/study\/([^/]+)\//)![1];
  await page.goto(`./#/print/${id}/handout`);
  await expect(page.getByText(/Support passage — Malachi 4:5/)).toBeVisible();
  await expect(page.getByText(/send you Elijah the prophet/i)).toBeVisible();
});

test('v2 Build lens: the centre previews the export; a study note and its write-lines render', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Author a question + a study note in Write.
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('What is Zacharias doing?');
  await page.getByRole('button', { name: '＋ study note' }).click();
  await page
    .locator('[data-mention-editor][aria-label^="Explain it for the group"]')
    .fill('Incense marked the hour of prayer.');

  // Build: the centre is a live preview showing both blocks; the right panel assembles.
  await page.getByRole('button', { name: '09 Build' }).click();
  await expect(page.getByText('Participant handout · clean & answer-free')).toBeVisible();
  await expect(page.locator('[data-preview-block="question"]')).toContainText('What is Zacharias doing?');
  await expect(page.locator('[data-preview-block="study-note"]')).toContainText('Incense marked the hour of prayer.');

  // The Leader view reveals the leader tag; Participant does not carry it.
  await page.getByRole('button', { name: 'leader', exact: true }).click();
  await expect(page.getByText('Leader’s notes · everything')).toBeVisible();
});

test('v2 @mention autocomplete: @book → chapter → verse dropdowns build the reference', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '03 Survey' }).click();

  await page.locator('[data-v="LUKE.1.17"]').click();
  await page.getByRole('toolbar', { name: /selected verses/i }).getByRole('button', { name: /comment/i }).click();
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
  await page.getByRole('button', { name: '06 Theme & aim' }).click();

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

  await page.getByRole('button', { name: '＋ comment' }).click();
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

  const buildLens = () => page.getByRole('button', { name: '09 Build' }).click();
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

  await page.getByRole('button', { name: '06 Theme & aim' }).click();
  await page.fill('#v2-theme', 'God keeps his covenant promise.');

  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('What is Zechariah doing?');
  await page.locator('input[placeholder^="Expected answer"]').fill('Serving as priest.');

  // The Check lens runs the audit on the study.
  await page.getByRole('button', { name: '10 Check' }).first().click();
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
  await page.getByRole('button', { name: '06 Theme & aim' }).first().click();

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

test('v2 Weigh lens: the weighed Theme supersedes (revised leads, original kept) + a commentary note appends', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Theme & aim (06): commit a theme.
  await page.getByRole('button', { name: '06 Theme & aim' }).click();
  await page.fill('#v2-theme', 'God keeps his covenant, answering long prayer in his own timing.');

  // Survey (03): a card to weigh.
  await page.getByRole('button', { name: '03 Survey' }).click();
  await page.locator('[data-v="LUKE.1.9"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /confusion/i }).click();

  // Weigh (07): the Theme supersede — the weighed revision leads, the original is kept.
  await page.getByRole('button', { name: '07 Weigh' }).click();
  await page.locator('[data-revise="theme"]').click();
  await page
    .locator('[data-weigh-primary="theme"]')
    .fill('God keeps covenant by sending the forerunner — answering long prayer in his own timing.');
  await expect(page.getByText('★ revised leads')).toBeVisible();
  // the original is preserved, demoted to the "was · kept" line
  await expect(
    page.getByText('God keeps his covenant, answering long prayer in his own timing.'),
  ).toBeVisible();

  // a 📖 commentary note appends to the card (round 2, same unified list as Deepen).
  await page.getByRole('button', { name: /add a commentary note/i }).click();
  await page.locator('[data-focus-rev]').first().fill('A once-in-a-lifetime honour — “ordinary” undersells it.');

  // Persist, reload — the weighed theme still leads.
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByRole('button', { name: '07 Weigh' }).click();
  await expect(page.locator('[data-weigh-primary="theme"]')).toHaveValue(/sending the forerunner/);
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
  await page.getByRole('toolbar').getByRole('button', { name: /confusion/i }).click();

  // Deepen (round 1): the Survey card returns with its First pass; append an own-work note.
  await page.getByRole('button', { name: '05 Deepen' }).click();
  await expect(page.getByText('First pass', { exact: true })).toBeVisible();
  await expect(page.getByText('Confusion', { exact: true })).toBeVisible();
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

test('v2 Write lens: author a study note (a prose block that prints for the group), and it persists', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Write (08): add a study note — a new output kind, distinct from a question.
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.getByRole('button', { name: '＋ study note' }).click(); // ＋ study note
  await expect(page.getByText('Study note', { exact: true })).toBeVisible(); // the card tag

  // Study notes carry prose (via the same @-mention editor as notes); type into it.
  const editor = page.locator('[data-mention-editor]');
  await editor.click();
  await editor.pressSequentially('Incense marked the hour of prayer — the crowd outside is praying.');

  // Persist, reload — the study note (and its text) survive.
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByRole('button', { name: '08 Write' }).click();
  await expect(page.getByText(/Incense marked the hour of prayer/)).toBeVisible();
});

test('v2 Write lens: the secondary "＋ comment" adds a prior-type card, kept as a Survey card', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // In Write you can jot a prior lens's card-type without leaving — a Survey comment.
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('aside').getByRole('button', { name: '＋ comment' }).click();

  // It lands as a Comment card whose origin is Survey (source line + a Survey filter chip appear),
  // not a Write card — so the chips and provenance stay meaningful wherever it was jotted.
  const panel = page.locator('aside');
  await expect(panel.getByText('Comment', { exact: true })).toBeVisible(); // the card tag
  await expect(panel.getByText(/step 03 · Survey/)).toBeVisible(); // origin = Survey, not Write
  await expect(panel.getByRole('button', { name: 'Survey', exact: true })).toBeVisible(); // the filter chip
});

test('v2 Write: attach an image to a question — thumbnail + caption persist across reload', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('aside').getByRole('button', { name: '＋ question' }).click();

  // Attach: set the hidden file input directly (the button just proxies to it). The image is the
  // user's own upload — the tool never sources one (rule 1).
  await page
    .locator('aside input[type="file"]')
    .setInputFiles(fileURLToPath(new URL('./fixtures/test-image.png', import.meta.url)));

  // A thumbnail lands (alt defaults to "Attached image" until captioned); caption it.
  await expect(page.locator('aside').getByRole('img', { name: 'Attached image' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Image caption' }).fill('The temple');

  // Persist across reload — the bytes live in the IndexedDB image store, the ref in the study body.
  const studyId = page.url().match(/study\/([^/]+)/)?.[1];
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByRole('button', { name: '08 Write' }).click();
  await expect(page.getByRole('textbox', { name: 'Image caption' })).toHaveValue('The temple');
  await expect(page.locator('aside').getByRole('img', { name: 'The temple' })).toBeVisible();

  // The image prints in the participant handout (bytes resolved from the store to a data URL).
  await page.goto(`./#/print/${studyId}/handout`);
  await expect(page.getByRole('figure', { name: 'The temple' })).toBeVisible();
});

test('v2 images: a near-full browser storage quota warns before the add button', async ({ page }) => {
  // Report the Storage Manager as ~90% full before any app script runs.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        estimate: () => Promise.resolve({ usage: 900, quota: 1000 }),
        persisted: () => Promise.resolve(true),
      },
    });
  });
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('aside').getByRole('button', { name: '＋ question' }).click();

  // The amber quota note appears near the add-image affordance (adding is still allowed).
  await expect(page.locator('aside').getByText(/Browser storage 90% full/)).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: '🖼 add image' })).toBeVisible();
});

test('v2 Build: attach a reference to a question (prints as support) + "in study" holds a card back', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  // Write: author a question and attach a reference to it (its text stays clean).
  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('What is Zacharias doing?');
  await page.getByRole('button', { name: /add reference/i }).click();
  // The reference picker: type a full reference and press Enter (or pick book → chapter → verse).
  await page.getByRole('textbox', { name: 'Reference' }).fill('Malachi 4:5-6');
  await page.getByRole('textbox', { name: 'Reference' }).press('Enter');
  await expect(page.getByText(/↗ Mal 4:5/)).toBeVisible(); // the attached-reference chip

  // A second question, so we can hold one back (target the newest card — it sorts last, at v17).
  await page.locator('[data-v="LUKE.1.17"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').last().fill('What was promised about Elijah?');

  // Build: the preview shows both questions, and Q1's reference prints as a support passage.
  await page.getByRole('button', { name: '09 Build' }).click();
  await expect(page.getByText(/Support passage — Mal 4:5/)).toBeVisible();
  await expect(page.locator('[data-preview-block="question"]')).toHaveCount(2);

  // Hold the second question back with the "in study" toggle → it drops from the export.
  await page.getByRole('button', { name: /in study/i }).nth(1).click();
  await expect(page.locator('[data-preview-block="question"]')).toHaveCount(1);
});

test('v2 reference picker: guided book → chapter → verse click-through attaches a reference', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /read the passage/i }).click();

  await page.getByRole('button', { name: '08 Write' }).click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: /question/i }).click();
  await page.locator('textarea[data-focus]').fill('What is Zacharias doing?');
  await page.getByRole('button', { name: /add reference/i }).click();

  // Type just the book stem, then pick entirely by clicking — the autocomplete's core value.
  await page.getByRole('textbox', { name: 'Reference' }).fill('Mal');
  const book = page.locator('[data-testid="ref-suggest"][data-mode="book"]');
  await expect(book).toBeVisible();
  await book.getByRole('button', { name: 'Malachi' }).click();

  const chapter = page.locator('[data-testid="ref-suggest"][data-mode="chapter"]');
  await expect(chapter).toBeVisible();
  await chapter.getByRole('option', { name: '4', exact: true }).click();

  const verse = page.locator('[data-testid="ref-suggest"][data-mode="verse"]');
  await expect(verse).toBeVisible();
  await verse.getByRole('option', { name: '5', exact: true }).click();

  // The picked reference lands as an attached-reference chip.
  await expect(page.getByText(/↗ Mal 4:5/)).toBeVisible();
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
