const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractArray(name) {
  const re = new RegExp('let ' + name + ' = ');
  const start = html.search(re);
  if (start < 0) throw new Error('not found ' + name);
  let i = html.indexOf('[', start);
  let depth = 0;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return html.slice(i, j + 1);
    }
  }
  throw new Error('unclosed ' + name);
}

const cfgStart = html.indexOf('const CONFIG');
const storeStart = html.indexOf('store:', cfgStart);
const slice = html.slice(storeStart, storeStart + 1500);

function f(key) {
  const m = slice.match(new RegExp(key + ":\\s*'([^']*)'"));
  return m ? m[1] : '';
}

const categories = eval(extractArray('categories')).map((c, i) => ({ ...c, order: i }));
const products = eval(extractArray('products'));
const promotions = eval(extractArray('promotions')).map((p, idx) => ({ id: idx + 1, ...p }));
const heroRaw = eval(extractArray('heroImages'));
const hero_images = heroRaw.map((url, idx) => ({ id: idx + 1, url, order: idx }));
const store_info = [{
  id: 1,
  story: f('story'),
  mission: f('mission'),
  hours: f('hours'),
  address: f('address'),
  email: f('email'),
  instagram: f('instagram')
}];

const payload = { categories, products, promotions, hero_images, store_info };
const out = path.join(__dirname, '..', 'lapianola-seed.json');
fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
console.log('written', out);
console.log({
  categories: categories.length,
  products: products.length,
  promotions: promotions.length,
  hero_images: hero_images.length,
  story: store_info[0].story.slice(0, 60)
});
