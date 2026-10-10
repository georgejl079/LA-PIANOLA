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

    // Proxy para imágenes de Storage (bucket privado)
    if (url.pathname.startsWith('/api/image/')) {
      const path = decodeURIComponent(url.pathname.replace('/api/image/', ''));
      const bucket = env.SUPABASE_BUCKET || 'images';
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
      const imgRes = await fetch(imageUrl, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });
      if (!imgRes.ok) return new Response('Not Found', { status: 404 });
      const blob = await imgRes.blob();
      return new Response(blob, {
        headers: { 'Content-Type': imgRes.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
      });
    }

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
          name: p.name,
          brand: p.brand || 'LA PIANOLA',
          price: Number(p.price),
          cat: p.cat,
          img: p.img,
          images: (() => {
            const primary = typeof p.img === 'string' && p.img.trim() ? p.img.trim() : '';
            let list = [];
            if (Array.isArray(p.images)) {
              list = p.images.filter(u => typeof u === 'string' && u.trim()).map(u => u.trim());
            } else if (typeof p.images === 'string' && p.images.trim()) {
              const raw = p.images.trim();
              if (raw.startsWith('[')) {
                try {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) list = parsed.filter(u => typeof u === 'string' && u.trim()).map(u => u.trim());
                } catch (_) {
                  list = [raw];
                }
              } else {
                list = [raw];
              }
            }
            if (primary) list = [primary, ...list.filter(u => u !== primary)];
            list = [...new Set(list.filter(Boolean))];
            const remote = list.filter(u => /^https?:\/\//i.test(u));
            return remote.length ? remote : (list.length ? list : (primary ? [primary] : []));
          })(),
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
