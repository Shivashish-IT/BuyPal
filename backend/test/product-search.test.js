import test from 'node:test';
import assert from 'node:assert/strict';
import { searchProducts } from '../src/services/product-search.service.js';

test('search finds products by multiple query terms', async () => {
  const results = await searchProducts({ query: 'Lenovo laptop', currency: 'INR' });
  assert.ok(results.length > 0);
  assert.ok(results.every(item => item.currency === 'INR'));
  assert.ok(results.every(item => item.source === 'demo' && item.priceIsLive === false));
});

test('search applies category and maximum price filters', async () => {
  const results = await searchProducts({
    query: '',
    category: 'phones',
    maxPrice: 30000,
    currency: 'INR',
    limit: 5,
  });
  assert.ok(results.length > 0);
  assert.ok(results.every(item => item.category === 'phones' && item.price <= 30000));
});

test('search returns no results for an unmatched query', async () => {
  const results = await searchProducts({ query: 'nonexistent-product', currency: 'INR' });
  assert.equal(results.length, 0);
});
