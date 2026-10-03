export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, '');
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const routes = {
      '/api/categories': 'categories?order=order.asc',
      '/api/products': 'products?order=id.asc',
      '/api/promotions': 'promotions?order=id.asc',
      '/api/hero-images': 'hero_images?order=order.asc',
      '/api/store-info': 'store_info?id=eq.1',
    };

    const relative = routes[url.pathname];
    if (!relative) {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${relative}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        return new Response(text, { status: response.status, headers: { 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      let payload = data;

      if (url.pathname === '/api/categories') {
        payload = (data || []).map(c => ({ id: c.id, name: c.name, image: c.image }));
      } else if (url.pathname === '/api/products') {
        payload = (data || []).map(p => ({
          id: p.id,
          sku: p.sku || '',
          name: p.name,
          brand: p.brand || 'LA PIANOLA',
          price: Number(p.price),
          cat: p.cat,
          img: p.img,
          images: Array.isArray(p.images) ? p.images : [p.img],
          short_desc: p.short_desc || '',
          description: p.description || '',
          details: p.details || {},
          pairsWith: Array.isArray(p.pairsWith) ? p.pairsWith : [],
        }));
      } else if (url.pathname === '/api/promotions') {
        payload = (data || []).map(p => ({
          badge: p.badge || '',
          title: p.title,
          sub: p.sub || '',
          image: p.image,
          cat: p.cat,
          fullDescription: p.fullDescription || '',
          validUntil: p.validUntil || '',
          conditions: Array.isArray(p.conditions) ? p.conditions : [],
        }));
      } else if (url.pathname === '/api/hero-images') {
        payload = (data || []).map(h => h.url);
      } else if (url.pathname === '/api/store-info') {
        payload = data && data[0] ? {
          story: data[0].story || '',
          mission: data[0].mission || '',
          hours: data[0].hours || '',
          address: data[0].address || '',
          email: data[0].email || '',
          instagram: data[0].instagram || '',
        } : {};
      }

      return new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
