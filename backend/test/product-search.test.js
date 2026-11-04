import test from 'node:test';
import assert from 'node:assert/strict';
import { listProductPlatforms, registerProductProvider, searchProducts } from '../src/services/product-search.service.js';

test('trusted platform list contains the five requested services', () => {
  const platforms = listProductPlatforms();
  assert.deepEqual(platforms.map(platform => platform.id), ['amazon', 'flipkart', 'zomato', 'swiggy', 'blinkit']);
  assert.ok(platforms.every(platform => platform.status === 'not_connected'));
});

test('search fails closed and returns no demo or unverified products', async () => {
  const result = await searchProducts({ query: 'Samsung 25W charger', currency: 'INR' });
  assert.equal(result.verifiedOnly, true);
  assert.equal(result.count, 0);
  assert.deepEqual(result.products, []);
  assert.ok(result.platforms.every(platform => platform.status === 'unavailable'));
});

test('provider results must be verified and link to the registered retailer', async () => {
  registerProductProvider('amazon', {
    async search() {
      return [
        { name: 'Verified charger', price: 899, currency: 'INR', url: 'https://www.amazon.in/dp/example', verified: true },
        { name: 'Unverified charger', price: 499, currency: 'INR', url: 'https://unknown.example/item', verified: false },
      ];
    },
  });
  const result = await searchProducts({ query: 'charger', currency: 'INR' });
  assert.equal(result.count, 1);
  assert.equal(result.products[0].name, 'Verified charger');
  assert.equal(result.products[0].verified, true);
});
