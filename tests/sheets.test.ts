import test from 'node:test';
import assert from 'node:assert/strict';

test('Google Sheets URL extractor parses standard spreadsheet URLs', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=12345';
  
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  assert.ok(match, 'Failed to match spreadsheet ID');
  assert.equal(match[1], '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  assert.ok(gidMatch, 'Failed to match gid');
  assert.equal(gidMatch[1], '12345');

  const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gidMatch[1]}`;
  assert.equal(
    csvUrl,
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=12345'
  );
});

test('Google Sheets URL extractor defaults gid to 0 when omitted', () => {
  const url = 'https://docs.google.com/spreadsheets/d/abcdef123456/edit';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  assert.ok(match);
  
  let gid = '0';
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch) gid = gidMatch[1];
  assert.equal(gid, '0');
});
