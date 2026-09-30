import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { CloudSaveController, emptyContentToken, documentSignature } = require('../src/editor/persistence/cloudSaveController.ts');
const { ChapterRepositoryError } = require('../src/editor/persistence/chapterRepository.ts');
const doc = (title) => ({ version: 1, schemaVersion: 1, config: { title }, blocks: {}, sections: [] });
const token = (edit_version) => ({ revision: 1, edit_version, checksum: String(edit_version).padStart(64, 'a') });
function harness(save, record, online = () => true) {
  const disk = { record: undefined, archives: [] };
  const repository = { kind: 'cloud', save };
  const recovery = { save: (value) => { disk.record = structuredClone(value); }, archive: (value) => disk.archives.push(structuredClone(value)) };
  const controller = new CloudSaveController(record || { target: { masterChapterId: 'chapter', curriculumVersionId: 'version' }, base: emptyContentToken(), acknowledged: '' }, repository, recovery, () => {}, online, 60000);
  return { controller, repository, recovery, disk };
}

test('edits during a save are sent next with the acknowledged token; Saved covers all edits', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const calls = [];
  const { controller, disk } = harness(async (document, _target, options) => {
    calls.push(structuredClone({ document, options }));
    if (calls.length === 1) await gate;
    return token(calls.length);
  });
  controller.update(doc('first'));
  const flush = controller.flush();
  controller.update(doc('second'));
  assert.equal(controller.status.state, 'Saving');
  release();
  await flush;
  assert.equal(calls.length, 2);
  assert.equal(calls[1].document.config.title, 'second');
  assert.deepEqual(calls[1].options.base, token(1));
  assert.notEqual(calls[0].options.idempotencyKey, calls[1].options.idempotencyKey);
  assert.equal(controller.status.state, 'Saved');
  assert.equal(controller.dirty, false);
  assert.equal(disk.record.document.config.title, 'second');
  controller.dispose();
});

test('lost response after commit retries the exact request even after a browser restart', async () => {
  const calls = [];
  const save = async (document, _target, options) => {
    calls.push(structuredClone({ document, options }));
    if (calls.length === 1) throw new Error('Response lost after commit');
    return token(1);
  };
  const first = harness(save);
  first.controller.update(doc('committed'));
  await assert.rejects(first.controller.flush(), /Response lost/);
  assert.equal(first.controller.status.state, 'Cloud save failed');
  assert.ok(first.disk.record.pending);
  first.controller.dispose();
  const restarted = harness(save, first.disk.record);
  restarted.controller.update(doc('later edit'));
  await restarted.controller.flush();
  assert.deepEqual(calls[1], calls[0]);
  assert.equal(calls[2].document.config.title, 'later edit');
  assert.deepEqual(calls[2].options.base, token(1));
  assert.equal(restarted.controller.status.state, 'Saved');
  restarted.controller.dispose();
});

test('conflicts persist across restart and cannot be overwritten by retry; reload archives local edits', async () => {
  let attempts = 0;
  const save = async () => { attempts++; throw new ChapterRepositoryError('Updated by another author', 'CONTENT_CONFLICT', 409, token(8)); };
  const first = harness(save);
  first.controller.update(doc('local work'));
  await assert.rejects(first.controller.flush(), /Updated by another author/);
  first.controller.dispose();
  const restarted = harness(save, first.disk.record);
  assert.equal(restarted.controller.status.state, 'Conflict detected');
  await assert.rejects(restarted.controller.flush(), /Reload or compare/);
  assert.equal(attempts, 1);
  restarted.controller.acceptRemote({ ...token(8), document: doc('central work') });
  assert.equal(restarted.disk.archives[0].config.title, 'local work');
  assert.equal(restarted.controller.document.config.title, 'central work');
  assert.equal(restarted.controller.dirty, false);
  restarted.controller.dispose();
});

test('offline edits are durable locally and resume when online; layout key ordering is a no-op', async () => {
  let online = false;
  let saves = 0;
  const { controller, disk } = harness(async () => { saves++; return token(1); }, undefined, () => online);
  controller.update(doc('offline work'));
  assert.equal(controller.status.state, 'Offline');
  assert.equal(disk.record.document.config.title, 'offline work');
  await assert.rejects(controller.flush(), /Offline/);
  assert.equal(saves, 0);
  online = true;
  await controller.flush();
  assert.equal(saves, 1);
  controller.update({ sections: [], blocks: {}, config: { title: 'offline work' }, schemaVersion: 1, version: 1 });
  await controller.flush();
  assert.equal(saves, 1);
  assert.equal(documentSignature(doc('offline work')), disk.record.acknowledged);
  controller.dispose();
});

test('unavailable recovery storage blocks the network write and never displays Saved', async () => {
  let saves = 0;
  const { controller, recovery } = harness(async () => { saves++; return token(1); });
  recovery.save = () => { throw new Error('Quota exceeded'); };
  controller.update(doc('valuable content'));
  assert.equal(controller.status.state, 'Cloud save failed');
  await assert.rejects(controller.flush(), /Quota exceeded/);
  assert.equal(saves, 0);
  assert.equal(controller.dirty, true);
  controller.dispose();
});
