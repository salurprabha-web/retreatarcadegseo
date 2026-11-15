#!/usr/bin/env node
/**
 * Public-site SEO audit. Needs no login.
 *   node scripts/seo-audit.js [https://www.retreatarcade.in] [out.json]
 * Reads the sitemap, fetches every page and reports: broken or redirecting sitemap URLs, missing or duplicate
 * titles and descriptions, canonical problems, noindex pages in the sitemap, thin pages, heading problems,
 * structured data types, images without alt text, and pages nothing links to (orphans).
 */
const base = (process.argv[2] || 'https://www.retreatarcade.in').replace(/\/$/, '');
const out = process.argv[3] || 'seo-audit.json';
const fs = require('fs');

const get = async (u, manual = true) => {
  const r = await fetch(u, { redirect: manual ? 'manual' : 'follow', headers: { 'User-Agent': 'RetreatArcadeSeoAudit/1.0' }, signal: AbortSignal.timeout(30000) });
  return r;
};
const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => { const m = tag.match(new RegExp(name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i')); return m ? decode(m[2] ?? m[3]) : ''; };

(async () => {
  const sm = await (await get(base + '/sitemap.xml', false)).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]).replace(/\/$/, ''));
  console.log(`sitemap: ${urls.length} URLs`);
  const norm = (u) => { try { const x = new URL(u, base); return x.origin + x.pathname.replace(/\/$/, '') ; } catch { return ''; } };
  const sitemapSet = new Set(urls.map(norm));
  const pages = [];
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      const url = urls[i++];
      const rec = { url, status: 0, redirect: '', title: '', description: '', canonical: '', robots: '', h1: 0, words: 0, jsonld: [], imgNoAlt: 0, imgs: 0, ogImage: false, links: [] };
      try {
        const r = await get(url, true);
        rec.status = r.status;
        if (r.status >= 300 && r.status < 400) rec.redirect = r.headers.get('location') || '';
        if (r.status === 200) {
          const html = await r.text();
          const head = html.slice(0, 200000);
          rec.title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
          for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
            const t = m[0];
            const n = attr(t, 'name') || attr(t, 'property');
            if (n === 'description') rec.description = attr(t, 'content');
            if (n === 'robots') rec.robots = attr(t, 'content');
            if (n === 'og:image') rec.ogImage = true;
          }
          const can = head.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i);
          rec.canonical = can ? attr(can[0], 'href') : '';
          rec.h1 = (html.match(/<h1[\s>]/gi) || []).length;
          const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
          rec.words = body.split(/\s+/).filter(Boolean).length;
          for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
            try { const j = JSON.parse(m[1]); (Array.isArray(j) ? j : [j]).forEach((x) => (x['@graph'] || [x]).forEach((y) => rec.jsonld.push(String(y['@type'])))); } catch { rec.jsonld.push('INVALID_JSON'); }
          }
          for (const m of html.matchAll(/<img\b[^>]*>/gi)) { rec.imgs++; if (!/\balt\s*=\s*"[^"]+"/i.test(m[0])) rec.imgNoAlt++; }
          const set = new Set();
          for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) { const n = norm(decode(m[1])); if (n.startsWith(base)) set.add(n); }
          rec.links = [...set];
        }
      } catch (e) { rec.error = String(e.message || e); }
      pages.push(rec);
      if (pages.length % 50 === 0) console.log(`  ${pages.length}/${urls.length}`);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  // inbound links
  const inbound = new Map();
  pages.forEach((p) => p.links.forEach((l) => { if (l !== norm(p.url)) inbound.set(l, (inbound.get(l) || 0) + 1); }));

  const ok = pages.filter((p) => p.status === 200);
  const dupBy = (key) => { const m = new Map(); ok.forEach((p) => { const k = (p[key] || '').trim().toLowerCase(); if (k) m.set(k, [...(m.get(k) || []), p.url]); }); return [...m.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => ({ text: k, count: v.length, urls: v.slice(0, 8) })); };
  const report = {
    base, generated: new Date().toISOString(), sitemapUrls: urls.length,
    notOk: pages.filter((p) => p.status !== 200).map((p) => ({ url: p.url, status: p.status, redirect: p.redirect, error: p.error })),
    noTitle: ok.filter((p) => !p.title).map((p) => p.url),
    noDescription: ok.filter((p) => !p.description).map((p) => p.url),
    titleTooLong: ok.filter((p) => p.title.length > 65).map((p) => ({ url: p.url, len: p.title.length })),
    descTooLong: ok.filter((p) => p.description.length > 165).map((p) => ({ url: p.url, len: p.description.length })),
    duplicateTitles: dupBy('title'),
    duplicateDescriptions: dupBy('description'),
    canonicalNotSelf: ok.filter((p) => p.canonical && norm(p.canonical) !== norm(p.url)).map((p) => ({ url: p.url, canonical: p.canonical })),
    noCanonical: ok.filter((p) => !p.canonical).map((p) => p.url),
    canonicalToNonSitemap: ok.filter((p) => p.canonical && norm(p.canonical) !== norm(p.url) && !sitemapSet.has(norm(p.canonical))).map((p) => ({ url: p.url, canonical: p.canonical })),
    noindexInSitemap: ok.filter((p) => /noindex/i.test(p.robots)).map((p) => p.url),
    thin: ok.filter((p) => p.words < 300).map((p) => ({ url: p.url, words: p.words })),
    h1Problems: ok.filter((p) => p.h1 !== 1).map((p) => ({ url: p.url, h1: p.h1 })),
    noStructuredData: ok.filter((p) => !p.jsonld.length).map((p) => p.url),
    invalidJsonLd: ok.filter((p) => p.jsonld.includes('INVALID_JSON')).map((p) => p.url),
    imagesWithoutAlt: ok.filter((p) => p.imgNoAlt > 0).map((p) => ({ url: p.url, missing: p.imgNoAlt, of: p.imgs })),
    noOgImage: ok.filter((p) => !p.ogImage).map((p) => p.url),
    orphans: ok.filter((p) => !(inbound.get(norm(p.url)) > 0)).map((p) => p.url),
    fewInbound: ok.filter((p) => (inbound.get(norm(p.url)) || 0) === 1).length,
    byType: {},
  };
  ok.forEach((p) => { const seg = new URL(p.url).pathname.split('/').filter(Boolean); const t = seg.length ? '/' + seg[0] + (seg.length > 1 ? '/…' + (seg.length - 1) : '') : '/'; report.byType[t] = (report.byType[t] || 0) + 1; });
  fs.writeFileSync(out, JSON.stringify({ report, pages: pages.map(({ links, ...r }) => r) }, null, 1));
  const n = (k) => (Array.isArray(report[k]) ? report[k].length : report[k]);
  console.log('\n=== SUMMARY ===');
  for (const k of ['sitemapUrls', 'notOk', 'noTitle', 'noDescription', 'titleTooLong', 'descTooLong', 'duplicateTitles', 'duplicateDescriptions', 'canonicalNotSelf', 'canonicalToNonSitemap', 'noCanonical', 'noindexInSitemap', 'thin', 'h1Problems', 'noStructuredData', 'invalidJsonLd', 'imagesWithoutAlt', 'noOgImage', 'orphans']) console.log(k.padEnd(24), n(k));
  console.log('page types', report.byType);
})();
