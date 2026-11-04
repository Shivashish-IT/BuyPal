const trustedPlatforms = [
  { id: 'amazon', name: 'Amazon', category: 'shopping', website: 'https://www.amazon.in', verification: 'official_api', integration: 'pending_credentials' },
  { id: 'flipkart', name: 'Flipkart', category: 'shopping', website: 'https://www.flipkart.com', verification: 'official_api', integration: 'pending_credentials' },
  { id: 'zomato', name: 'Zomato', category: 'food', website: 'https://www.zomato.com', verification: 'authorised_partner_api', integration: 'access_required' },
  { id: 'swiggy', name: 'Swiggy', category: 'food', website: 'https://www.swiggy.com', verification: 'official_developer_api', integration: 'access_required' },
  { id: 'blinkit', name: 'Blinkit', category: 'grocery', website: 'https://blinkit.com', verification: 'authorised_partner_api', integration: 'access_required' },
];

const providers = new Map();

/**
 * Register only a provider backed by an authorised platform API or an explicitly
 * approved partner integration. Never register scraping or synthetic catalogue data.
 */
export function registerProductProvider(platformId, provider) {
  if (!trustedPlatforms.some(platform => platform.id === platformId)) {
    throw new Error('Unknown trusted product platform.');
  }
  if (!provider || typeof provider.search !== 'function') {
    throw new TypeError('A product provider must implement search().');
  }
  providers.set(platformId, provider);
}

export function listProductPlatforms() {
  return trustedPlatforms.map(platform => ({
    ...platform,
    status: providers.has(platform.id) ? 'connected' : 'not_connected',
  }));
}

export async function searchProducts({ query, category, maxPrice, currency = 'INR', limit = 10 }) {
  const platformResults = await Promise.all(trustedPlatforms.map(async platform => {
    const provider = providers.get(platform.id);
    if (!provider) {
      return {
        platform: platform.id,
        platformName: platform.name,
        status: 'unavailable',
        reason: 'No authorised API connection is configured. No unverified results are shown.',
        products: [],
      };
    }

    try {
      const products = await provider.search({ query, category, maxPrice, currency, limit });
      const verifiedProducts = products
        .filter(product => product && product.verified === true)
        .filter(product => typeof product.name === 'string' && product.name.trim())
        .filter(product => typeof product.url === 'string' && product.url.startsWith(platform.website))
        .filter(product => typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0)
        .filter(product => !maxPrice || product.price <= maxPrice)
        .filter(product => !product.currency || product.currency === currency)
        .slice(0, limit)
        .map(product => ({
          ...product,
          platform: platform.id,
          platformName: platform.name,
          verified: true,
          priceIsLive: true,
        }));

      return {
        platform: platform.id,
        platformName: platform.name,
        status: 'connected',
        reason: verifiedProducts.length ? null : 'The authorised source returned no verified matches.',
        products: verifiedProducts,
      };
    } catch {
      return {
        platform: platform.id,
        platformName: platform.name,
        status: 'error',
        reason: 'The authorised platform could not be reached. Try again later.',
        products: [],
      };
    }
  }));

  const products = platformResults.flatMap(result => result.products)
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);

  return {
    query,
    currency,
    verifiedOnly: true,
    count: products.length,
    products,
    platforms: platformResults.map(({ platform, platformName, status, reason }) => ({
      platform, platformName, status, reason,
    })),
    recommendation: products.length
      ? 'Results are ranked by listed price. Confirm delivery charges, stock and final payable amount on the retailer checkout page.'
      : 'No verified results are currently available. No demo, scraped or guessed listings were substituted.',
  };
}
