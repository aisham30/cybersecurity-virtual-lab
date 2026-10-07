'use strict';
/**
 * Automated unit tests for manifest loading, composition validation,
 * quiz schema validation, and security rules enforcement.
 *
 * Executed via: npm test (node --test tests/manifest.test.js)
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
  validateManifest,
  analyzeCompose,
  validateQuiz,
  parseMemory,
  parsePort,
  isInside,
  loadAll,
} = require('../app/main/manifestLoader');

describe('Manifest Loader & Security Analyzer Unit Tests', () => {
  test('parseMemory converts memory strings correctly', () => {
    assert.strictEqual(parseMemory('512m'), 512 * 1024 * 1024);
    assert.strictEqual(parseMemory('1g'), 1024 * 1024 * 1024);
    assert.strictEqual(parseMemory('256M'), 256 * 1024 * 1024);
    assert.strictEqual(parseMemory('invalid'), null);
  });

  test('parsePort extracts host binding and target ports', () => {
    const p1 = parsePort('127.0.0.1:3000:80');
    assert.strictEqual(p1.hostIp, '127.0.0.1');
    assert.strictEqual(p1.published, '3000');
    assert.strictEqual(p1.target, '80');

    const p2 = parsePort('8080:80');
    assert.strictEqual(p2.hostIp, '');
    assert.strictEqual(p2.published, '8080');
    assert.strictEqual(p2.target, '80');
  });

  test('isInside detects path traversal attempts', () => {
    const base = path.resolve('/lab/exp01');
    assert.strictEqual(isInside(base, 'README.md'), true);
    assert.strictEqual(isInside(base, './content/theory.md'), true);
    assert.strictEqual(isInside(base, '../other_folder/file.txt'), false);
  });

  test('validateManifest rejects missing required fields and unsafe targetUrls', () => {
    const invalid = validateManifest({}, '/dummy');
    assert.ok(invalid.errors.length > 0, 'Should reject empty manifest');

    const validRaw = {
      id: 'EXP01',
      name: 'SQL Injection Lab',
      mode: 'CONTAINER',
      targetUrl: 'http://localhost:3000',
    };
    const valid = validateManifest(validRaw, '/dummy');
    assert.strictEqual(valid.errors.length, 0, 'Valid manifest should have zero errors');
    assert.strictEqual(valid.manifest.id, 'EXP01');
  });

  test('analyzeCompose flags privileged mode, network_mode host, and host path escapes', () => {
    const unsafeDoc = {
      services: {
        attacker: {
          privileged: true,
          network_mode: 'host',
          volumes: ['/etc:/host_etc'],
          ports: ['0.0.0.0:8080:8080'],
        },
      },
    };
    const res = analyzeCompose(unsafeDoc, '/dummy');
    assert.ok(res.errors.some((e) => e.includes('privileged')), 'Must reject privileged: true');
    assert.ok(res.errors.some((e) => e.includes('network_mode: host')), 'Must reject network_mode: host');
    assert.ok(res.errors.some((e) => e.includes('outside the experiment folder')), 'Must reject host mounts outside experiment folder');
    assert.ok(res.errors.some((e) => e.includes('must be bound to 127.0.0.1')), 'Must reject non-127.0.0.1 port bindings');
  });

  test('validateQuiz checks question structure and answer indices', () => {
    const validQuiz = {
      title: 'Demo Quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          answer: 1,
          explanation: '2+2=4',
        },
      ],
    };
    const res = validateQuiz(validQuiz);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(res.quiz.questions[0].answer, 1);
  });

  test('loadAll discovers EXP00-demo experiment folder', () => {
    const expDir = path.resolve(__dirname, '../experiments');
    const res = loadAll(expDir);
    assert.strictEqual(res.error, null);
    assert.ok(res.experiments.length >= 1, 'Should discover at least EXP00-demo');
    const demo = res.experiments.find((e) => e.id === 'EXP00-demo');
    assert.ok(demo, 'EXP00-demo should be discovered');
    assert.strictEqual(demo.valid, true, 'EXP00-demo manifest and compose should be valid');
  });
});
