import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const nom   = req.nextUrl.searchParams.get('nom')   || ''
  const ville = req.nextUrl.searchParams.get('ville') || ''

  const analyserUrl = `https://thelocalboost.fr/analyser?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}&utm_source=widget&utm_medium=embed`

  const js = `
(function() {
  var nom = ${JSON.stringify(nom)};
  var ville = ${JSON.stringify(ville)};
  var url = ${JSON.stringify(analyserUrl)};

  var el = document.createElement('a');
  el.href = url;
  el.target = '_blank';
  el.rel = 'noopener';
  el.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:#16a34a;color:#fff;text-decoration:none;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;padding:8px 14px;border-radius:8px;';
  el.innerHTML = '<span>📍</span><span>Score Google vérifié par LocalBoost</span>';

  var container = document.currentScript ? document.currentScript.parentNode : document.body;
  container.appendChild(el);
})();
`.trim()

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
