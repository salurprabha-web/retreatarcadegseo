import Link from 'next/link';
import {
  CheckCircle2, ArrowRight, Code2, Zap, ShieldCheck, Clock,
  Sparkles, QrCode, Mail, BarChart3, Layers, ChevronRight,
  Calendar, Users, Lock, Smartphone, Globe, Settings,
} from 'lucide-react';

// ✅ Maps an admin-entered icon keyword (e.g. "qrcode") to a real icon
// component. Add more mappings here as needed — no code change required
// elsewhere, just pick from this list of keywords in the admin panel.
const ICON_MAP: Record<string, any> = {
  qrcode: QrCode,
  chart: BarChart3,
  mail: Mail,
  layers: Layers,
  calendar: Calendar,
  users: Users,
  lock: Lock,
  mobile: Smartphone,
  globe: Globe,
  settings: Settings,
  sparkles: Sparkles,
  shield: ShieldCheck,
  clock: Clock,
  code: Code2,
  zap: Zap,
};

function resolveIcon(name: string) {
  return ICON_MAP[name?.toLowerCase()] || Sparkles;
}

// ✅ FULL REDESIGN — distinct visual identity from the rental-product
// template AND from the previous tech-service version. New hero treatment,
// icon-illustrated feature cards (not generic checkmarks), a visual
// "How It Works" timeline, and a genuine cross-sell section pulling both
// sibling tech services and complementary rental products.

// ✅ FIX: content saved through some CMS paths got double (or triple)
// HTML-escaped — e.g. "<p>&lt;p&gt;Real text&lt;/p&gt;</p>" instead of a
// single clean "<p>Real text</p>". A single decode pass left nested
// &lt;h2&gt;, &lt;li&gt; etc. still escaped, which silently broke the
// entire section parser (it found zero real <h2> tags inside the
// escaped blob, so nothing structured rendered). This now decodes
// repeatedly until the string stops changing, unwrapping any depth
// of double-escaping.
function decodeHtmlEntities(str: string): string {
  let result = str;
  for (let i = 0; i < 5; i++) {
    const next = result
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    if (next === result) break;
    result = next;
  }
  return result;
}

function parseDescriptionSections(rawHtml: string) {
  const html = decodeHtmlEntities(rawHtml);
  const sections: { heading: string | null; items: string[]; paragraphs: string[] }[] = [];
  const blocks = html.split(/<h2>/i);

  blocks.forEach((block, i) => {
    if (i === 0 && !block.includes('</h2>')) {
      const paragraphs = Array.from(block.matchAll(/<p>(.*?)<\/p>/gis)).map(m => m[1].replace(/<[^>]+>/g, ''));
      if (paragraphs.length) sections.push({ heading: null, items: [], paragraphs });
      return;
    }
    const headingMatch = block.match(/^(.*?)<\/h2>/i);
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '') : null;
    const rest = headingMatch ? block.slice(headingMatch[0].length) : block;
    const items = Array.from(rest.matchAll(/<li>(.*?)<\/li>/gis)).map(m => m[1].replace(/<[^>]+>/g, ''));
    const paragraphs = Array.from(rest.matchAll(/<p>(.*?)<\/p>/gis)).map(m => m[1].replace(/<[^>]+>/g, ''));
    if (heading) sections.push({ heading, items, paragraphs });
  });

  return sections;
}

// Maps feature text to a relevant icon by keyword — makes the feature
// grid feel designed rather than a generic repeated checkmark
function pickFeatureIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes('qr') || t.includes('check-in')) return QrCode;
  if (t.includes('email') || t.includes('communication') || t.includes('confirmation')) return Mail;
  if (t.includes('analytic') || t.includes('report') || t.includes('dashboard')) return BarChart3;
  if (t.includes('session') || t.includes('track') || t.includes('multi')) return Layers;
  if (t.includes('secure') || t.includes('payment') || t.includes('pci')) return ShieldCheck;
  return Sparkles;
}

interface TechServiceTemplateProps {
  service: {
    title: string;
    summary: string | null;
    description: string;
    image_url: string | null;
    // ✅ Admin-controlled — no more hardcoded trust badges or feature panel
    trust_badges: string[] | null;
    key_features: { icon: string; label: string; sub: string }[] | null;
    trust_strip: { icon: string; label: string; sub: string }[] | null;
  };
  faqItems: { question: string; answer: string }[];
  siblingServices: { title: string; slug: string; summary: string | null }[];
  complementaryProducts: { title: string; slug: string; image_url: string | null; price: number | null }[];
}

export function TechServiceTemplate({
  service, faqItems, siblingServices, complementaryProducts,
}: TechServiceTemplateProps) {
  const sections = parseDescriptionSections(service.description || '');
  const introSection = sections.find(s => s.heading === null);
  const featureSection = sections.find(s => /core features|what's included|features/i.test(s.heading || ''));
  const howItWorksSection = sections.find(s => /how it works/i.test(s.heading || ''));
  const perfectForSection = sections.find(s => /perfect for/i.test(s.heading || ''));
  const otherSections = sections.filter(s =>
    s !== introSection && s !== featureSection && s !== howItWorksSection && s !== perfectForSection
  );

  return (
    <div className="bg-white">

      {/* ── HERO v2 — split layout, illustrated panel, breadcrumb ────────── */}
      <section className="relative bg-[#0a0e1f] overflow-hidden pt-24 pb-0">
        {/* Animated-feel grid backdrop */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)', transform: 'translate(25%,-35%)' }} />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-8">
            <Link href="/" className="hover:text-white/70 transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/services" className="hover:text-white/70 transition">Services</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60">{service.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-16">
            {/* Left — copy */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-full mb-6">
                <Code2 className="h-3 w-3" /> Custom Technology Build
              </span>
              <h1 className="text-4xl md:text-[3.2rem] font-extrabold text-white leading-[1.08] mb-6">
                {service.title}
              </h1>
              {service.summary && (
                <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl">
                  {service.summary}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Link href="/contact"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-7 rounded-xl transition shadow-lg shadow-orange-900/30">
                  Get a Custom Quote <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="https://wa.me/917993912762" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold py-3.5 px-7 rounded-xl transition">
                  Discuss on WhatsApp
                </a>
              </div>
              {/* ✅ Admin-controlled trust badges — falls back to nothing
                  shown if not set, rather than fake hardcoded claims */}
              {service.trust_badges && service.trust_badges.length > 0 && (
                <div className="flex items-center gap-6 mt-8 text-white/50 text-xs flex-wrap">
                  {service.trust_badges.map((badge, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right — illustrated stat panel instead of a generic image */}
            {/* ✅ Admin-controlled feature panel — only renders if the
                admin has actually filled in key_features for this service */}
            {service.key_features && service.key_features.length > 0 && (
              <div className="lg:col-span-5">
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-7 backdrop-blur-sm">
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-5">What you get</p>
                  <div className="space-y-4">
                    {service.key_features.map((feature, i) => {
                      const Icon = resolveIcon(feature.icon);
                      return (
                        <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-2xl p-3.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-blue-300" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{feature.label}</p>
                            <p className="text-white/40 text-xs">{feature.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wave/curve transition into white content */}
        <svg viewBox="0 0 1440 60" className="w-full block" preserveAspectRatio="none">
          <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" fill="white" />
        </svg>
      </section>

      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      {introSection && introSection.paragraphs.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pt-4 pb-14">
          {introSection.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 text-lg leading-relaxed mb-4 first:text-xl first:text-gray-900 first:font-medium">
              {p}
            </p>
          ))}
        </section>
      )}

      {/* ── Feature grid — icon-illustrated, keyword-matched ─────────────── */}
      {featureSection && featureSection.items.length > 0 && (
        <section className="bg-gradient-to-b from-gray-50 to-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">What's Inside</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{featureSection.heading}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureSection.items.map((item, i) => {
                const [lead, ...restParts] = item.split(/—|--/);
                const rest = restParts.join('—');
                const Icon = pickFeatureIcon(item);
                return (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="font-bold text-gray-900 mb-1.5">{lead.replace(/<\/?strong>/g, '')}</p>
                    {rest && <p className="text-sm text-gray-500 leading-relaxed">{rest}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works — horizontal timeline on desktop ────────────────── */}
      {howItWorksSection && howItWorksSection.items.length > 0 && (
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">The Process</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{howItWorksSection.heading}</h2>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-5 left-0 right-0 h-px bg-gray-200" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {howItWorksSection.items.map((step, i) => (
                  <div key={i} className="relative flex md:flex-col gap-4 md:gap-3 md:text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 relative z-10 md:mx-auto">
                      {i + 1}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed pt-1 md:pt-0">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Perfect For — pill tags on dark band ──────────────────────────── */}
      {perfectForSection && perfectForSection.items.length > 0 && (
        <section className="bg-[#0a0e1f] py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">Ideal Use Cases</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-8">{perfectForSection.heading}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {perfectForSection.items.map((item, i) => (
                <span key={i} className="bg-white/5 border border-white/15 text-gray-200 text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10 transition">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Other sections (Timeline, Available Across India, etc) ──────── */}
      {otherSections.map((sec, i) => (
        <section key={i} className="max-w-3xl mx-auto px-6 py-12">
          {sec.heading && <h2 className="text-2xl font-bold text-gray-900 mb-4">{sec.heading}</h2>}
          {sec.paragraphs.map((p, j) => (
            <p key={j} className="text-gray-700 leading-relaxed mb-3">{p}</p>
          ))}
          {sec.items.length > 0 && (
            <ul className="space-y-2 mt-3">
              {sec.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-gray-700">
                  <span className="text-blue-500">•</span> {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* ── Trust strip — ✅ now admin-controlled, only renders if set ──────── */}
      {service.trust_strip && service.trust_strip.length > 0 && (
        <section className="bg-gray-900 py-14">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {service.trust_strip.map((item, i) => {
              const Icon = resolveIcon(item.icon);
              return (
                <div key={i}>
                  <Icon className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CROSS-SELL — sibling tech services + complementary products ──── */}
      {(siblingServices.length > 0 || complementaryProducts.length > 0) && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">

            {siblingServices.length > 0 && (
              <div className="mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Related Technology Services</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pair This With</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {siblingServices.map((s) => (
                    <Link key={s.slug} href={`/services/${s.slug}`}
                      className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between gap-4 group">
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition">{s.title}</p>
                        {s.summary && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.summary}</p>}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {complementaryProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">Complete Your Event</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Products That Pair Well With This</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {complementaryProducts.map((p) => (
                    <Link key={p.slug} href={`/events/${p.slug}`}
                      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all">
                      <div className="bg-[#07091a] flex items-center justify-center overflow-hidden" style={{ minHeight: '160px' }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} loading="lazy"
                            className="w-full h-auto max-h-[190px] object-contain group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center text-white/20 text-3xl">🎪</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition mb-1">{p.title}</p>
                        {p.price && <p className="text-orange-600 font-bold text-sm">₹{p.price.toLocaleString('en-IN')}+</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2 text-center">Questions</p>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqItems.map((faq, i) => (
            <details key={i} className="border border-gray-200 rounded-2xl p-5 open:bg-blue-50/40 open:border-blue-200 group">
              <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center gap-3">
                {faq.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">⌄</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0e1f] py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to discuss your project?</h2>
          <p className="text-gray-400 mb-8 text-lg">Tell us about your event and what you need built — we'll scope it and send a custom quote within hours.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl transition">
              Get a Custom Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://wa.me/917993912762" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold py-3.5 px-8 rounded-xl transition">
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
