import { expect, test } from '@playwright/test';

// v2 acceptance (ROADMAP-v2 v2.2): the reader renders the real passage from the store,
// selection → Mark persists, and marks survive a reload. Drives the production preview.
test('v2 reader: load a passage, mark a verse, and it survives a reload', async ({ page }) => {
  await page.goto('./');

  // v2 Home is the default app at the root.
  await expect(page.getByRole('heading', { name: /prepare a bible study/i })).toBeVisible();

  await page.getByRole('button', { name: /new study/i }).click();

  // The Set-up engine: enter a reference, import a bundled translation, start mapping.
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /start mapping/i }).click();

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
  await page.getByRole('button', { name: /start mapping/i }).click();

  // The pasted text becomes the real passage and renders in the Map lens.
  await expect(page.locator('[data-v="PS.23.1"]')).toBeVisible();
  await expect(page.getByText(/Jehovah is my shepherd/i)).toBeVisible();
});

test('v2 annotations: a question tracks its expected answer (SPEC 6e) and persists', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /start mapping/i }).click();

  // Select a verse and add a Question from the action bar.
  await page.locator('[data-v="LUKE.1.10"]').click();
  await page.getByRole('button', { name: /question/i }).click();

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

test('v2 command palette: insert a cross-reference and switch translation', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: '+ ASV' }).click();
  await page.getByRole('button', { name: /start mapping/i }).click();
  await expect(page.locator('[data-v="LUKE.1.8"]')).toBeVisible();

  const openPalette = () => page.getByRole('button', { name: /\/ command/ }).click();

  // Insert a cross-reference to another passage.
  await openPalette();
  await page.getByRole('dialog').getByRole('textbox').fill('Malachi 4:5-6');
  await page.getByRole('button', { name: /insert cross-reference/i }).click();
  await expect(page.locator('input[placeholder="e.g. Malachi 4:5-6"]')).toHaveValue('Malachi 4:5-6');

  // Switch the primary translation.
  await openPalette();
  await page.getByRole('button', { name: /switch to american standard/i }).click();
  await expect(page.getByText('ASV · public domain')).toBeVisible();
});

test('v2 Build lens: questions order by verse, reorder, and persist', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /new study/i }).click();
  await page.fill('#v2-reference', 'Luke 1:5-25');
  await page.getByRole('button', { name: '+ WEBBE' }).click();
  await page.getByRole('button', { name: /start mapping/i }).click();

  const addQuestion = async (v: string) => {
    await page.locator(`[data-v="${v}"]`).click();
    await page.getByRole('button', { name: /question/i }).click();
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
  await page.getByRole('button', { name: /start mapping/i }).click();

  // Author one question with text + an expected answer.
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('button', { name: /question/i }).click();
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

  await page.getByRole('button', { name: /map/i }).first().click();
  await page.locator('[data-v="LUKE.1.8"]').click();
  await page.getByRole('button', { name: /question/i }).click();
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

test('v1 is archived under /v1/ and reachable', async ({ page }) => {
  await page.goto('./#/v1/');
  await expect(page.getByText(/archived v1 workbook/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /prepare a bible study/i })).toBeVisible();
});
