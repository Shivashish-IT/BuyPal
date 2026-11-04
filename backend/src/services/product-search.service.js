// Replace this demo catalogue with a live product provider when one is selected.
// Prices are illustrative demo values, not live retailer offers.
const demoProducts = [
  { id: 'demo-laptop-001', name: 'Lenovo IdeaPad Slim 5', category: 'laptops', brand: 'Lenovo', price: 64999, currency: 'INR', description: 'Demo listing for a lightweight everyday laptop.', retailer: 'BuyPal Demo Store', url: null },
  { id: 'demo-laptop-002', name: 'ASUS Vivobook 15', category: 'laptops', brand: 'ASUS', price: 52999, currency: 'INR', description: 'Demo listing for a general-purpose laptop.', retailer: 'BuyPal Demo Store', url: null },
  { id: 'demo-phone-001', name: 'Samsung Galaxy A56', category: 'phones', brand: 'Samsung', price: 41999, currency: 'INR', description: 'Demo listing for an Android smartphone.', retailer: 'BuyPal Demo Store', url: null },
  { id: 'demo-phone-002', name: 'Nothing Phone (3a)', category: 'phones', brand: 'Nothing', price: 24999, currency: 'INR', description: 'Demo listing for an Android smartphone.', retailer: 'BuyPal Demo Store', url: null },
  { id: 'demo-audio-001', name: 'Sony WH-CH720N', category: 'audio', brand: 'Sony', price: 8990, currency: 'INR', description: 'Demo listing for wireless noise-cancelling headphones.', retailer: 'BuyPal Demo Store', url: null },
  { id: 'demo-tablet-001', name: 'Lenovo Tab P12', category: 'tablets', brand: 'Lenovo', price: 27999, currency: 'INR', description: 'Demo listing for an Android tablet.', retailer: 'BuyPal Demo Store', url: null },
];

export async function searchProducts({ query, category, maxPrice, currency = 'INR', limit = 10 }) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return demoProducts
    .filter(product => product.currency === currency)
    .filter(product => !category || product.category === category.toLowerCase())
    .filter(product => !maxPrice || product.price <= maxPrice)
    .map(product => {
      const haystack = [product.name, product.brand, product.category, product.description].join(' ').toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { product, score };
    })
    .filter(({ score }) => terms.length === 0 || score > 0)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, limit)
    .map(({ product }) => ({ ...product, source: 'demo', priceIsLive: false }));
}
