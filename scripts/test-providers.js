// Basic test for dsh-web-search-providers
// Verifies provider class structure and available() logic

import { TavilySearchProvider, TAVILY_PROVIDER_ID } from '../lib/tavily.js';
import { BaiduSearchProvider, BAIDU_PROVIDER_ID } from '../lib/baidu.js';

const PASS = '✅';
const FAIL = '❌';
const results = [];

function check(name, condition, detail = '') {
  results.push({ name, status: condition ? PASS : FAIL, detail });
  console.log(`  ${condition ? PASS : FAIL} ${name}${detail ? ' — ' + detail : ''}`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  dsh-web-search-providers Test Suite');
console.log('═══════════════════════════════════════════════════════\n');

// ── Tavily provider ──
console.log('── Tavily Provider ──\n');

const tavilyNoKey = new TavilySearchProvider(() => ({ apiKey: '' }));
check('Tavily provider id', tavilyNoKey.id === TAVILY_PROVIDER_ID, `id=${tavilyNoKey.id}`);
check('Tavily unavailable without API key', tavilyNoKey.available() === false);

const tavilyWithKey = new TavilySearchProvider(() => ({
  apiKey: 'tvly-test-key',
  baseURL: 'https://api.tavily.com',
  maxResults: 5,
  searchDepth: 'basic',
  timeoutMs: 30000,
}));
check('Tavily available with API key', tavilyWithKey.available() === true);

// ── Baidu provider ──
console.log('\n── Baidu Provider ──\n');

const baiduNoKey = new BaiduSearchProvider(() => ({ apiKey: '', secretKey: '' }));
check('Baidu provider id', baiduNoKey.id === BAIDU_PROVIDER_ID, `id=${baiduNoKey.id}`);
check('Baidu unavailable without keys', baiduNoKey.available() === false);

const baiduPartial = new BaiduSearchProvider(() => ({ apiKey: 'key', secretKey: '' }));
check('Baidu unavailable with partial keys', baiduPartial.available() === false);

const baiduWithKeys = new BaiduSearchProvider(() => ({
  apiKey: 'test-key',
  secretKey: 'test-secret',
  endpoint: 'https://aip.baidubce.com',
  maxResults: 5,
  timeoutMs: 30000,
}));
check('Baidu available with both keys', baiduWithKeys.available() === true);

// ── Summary ──
console.log('\n═══════════════════════════════════════════════════════');
const passed = results.filter(r => r.status === PASS).length;
const failed = results.filter(r => r.status === FAIL).length;
console.log(`  Results: ${passed} passed, ${failed} failed, ${results.length} total`);
console.log('═══════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('Failed tests:');
  results.filter(r => r.status === FAIL).forEach(r => {
    console.log(`  ${FAIL} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  });
  process.exit(1);
} else {
  console.log('All tests passed! ✅');
}
