import Link from 'next/link';
import { CheckCircle2, ArrowRight, Code2, Zap, ShieldCheck } from 'lucide-react';

// ✅ NEW: Dedicated template for technology services (software, websites,
// apps). Completely different visual structure from the rental-product
// template — no price-led hero, no "Cities We Serve" section, no related
// equipment grid. Instead: feature grid, how-it-works steps, and a
// quote-focused CTA, written for buyers evaluating custom dev work.

interface TechServiceTemplateProps {
  service: {
    title: string;
    summary: string | null;
    description: string;
    image_url: string | null;
    highlights: string[] | null;
  };
  faqItems: { question: string; answer: string }[];
}

// Parses simple <h2>/<ul><li>/<p> description HTML into structured sections
// so we can render each with proper SEO-friendly semantic markup and
// distinct visual treatment, instead of one undifferentiated HTML dump.
function parseDescriptionSections(html: string) {
  const sections: { heading: string | null; items: string[]; paragraphs: string[] }[] = [];
  const blocks = html.split(/<h2>/i);

  blocks.forEach((block, i) => {
    if (i === 0 && !block.includes('</h2>')) {
      // Intro content before first <h2>
      const paragraphs = [...block.matchAll(/<p>(.*?)<\/p>/gis)].map(m => m[1].replace(/<[^>]+>/g, ''));
      if (paragraphs.length) sections.push({ heading: null, items: [], paragraphs });
      return;
    }
    const headingMatch = block.match(/^(.*?)<\/h2>/i);
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '') : null;
    const rest = headingMatch ? block.slice(headingMatch[0].length) : block;
    const items = [...rest.matchAll(/<li>(.*?)<\/li>/gis)].map(m => m[1].replace(/<[^>]+>/g, ''));
    const paragraphs = [...rest.matchAll(/<p>(.*?)<\/p>/gis)].map(m => m[1].replace(/<[^>]+>/g, ''));
    if (heading) sections.push({ heading, items, paragraphs });
  });

  return sections;
}

export function TechServiceTemplate({ service, faqItems }: TechServiceTemplateProps) {
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

      {/* ── Hero — dark, tech-forward, no price badge ──────────────────── */}
      <section className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full mb-5">
            <Code2 className="h-3 w-3" /> Custom Technology Build
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            {service.title}
          </h1>
          {service.summary && (
            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
              {service.summary}
            </p>
          )}
          <div className="flex justify-center mt-8">
            <Link href="/contact"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl transition">
              Get a Custom Quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Intro paragraph(s) ──────────────────────────────────────────── */}
      {introSection && introSection.paragraphs.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-14">
          {introSection.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 text-lg leading-relaxed mb-4">{p}</p>
          ))}
        </section>
      )}

      {/* ── Feature grid — distinct card layout, not a bullet dump ──────── */}
      {featureSection && featureSection.items.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              {featureSection.heading}
            </h2>
            <p className="text-gray-500 text-center mb-10">Everything included in this build</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureSection.items.map((item, i) => {
                // Splits "Bold lead-in — rest of sentence" formatting
                const [lead, ...restParts] = item.split(/—|--/);
                const rest = restParts.join('—');
                return (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong className="text-gray-900">{lead.replace(/<\/?strong>/g, '')}</strong>
                      {rest && <span> — {rest}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works — numbered steps, not <ol> ─────────────────────── */}
      {howItWorksSection && howItWorksSection.items.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            {howItWorksSection.heading}
          </h2>
          <div className="space-y-4">
            {howItWorksSection.items.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  {i + 1}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Perfect For — pill tags, not a bullet list ───────────────────── */}
      {perfectForSection && perfectForSection.items.length > 0 && (
        <section className="bg-blue-50 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{perfectForSection.heading}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {perfectForSection.items.map((item, i) => (
                <span key={i} className="bg-white border border-blue-200 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Any other sections (e.g. Timeline, Available Across India) ──── */}
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

      {/* ── Trust strip — relevant to software, not equipment rental ────── */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <Zap className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Fast Turnaround</p>
            <p className="text-gray-400 text-xs mt-1">Most builds launch in 1-3 weeks</p>
          </div>
          <div>
            <ShieldCheck className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Secure by Default</p>
            <p className="text-gray-400 text-xs mt-1">PCI-compliant payments, data privacy</p>
          </div>
          <div>
            <Code2 className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Fully Custom</p>
            <p className="text-gray-400 text-xs mt-1">Built for your event, not a template</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((faq, i) => (
            <details key={i} className="border border-gray-200 rounded-xl p-5 open:bg-gray-50 group">
              <summary className="font-semibold text-gray-800 cursor-pointer list-none flex justify-between items-center">
                {faq.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to discuss your project?</h2>
          <p className="text-gray-400 mb-8">Tell us about your event and what you need built — we'll scope it and send a custom quote.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl transition">
            Get a Custom Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
