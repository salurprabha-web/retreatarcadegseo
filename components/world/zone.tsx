import { cn } from '@/lib/utils';

/** Small label that tells the visitor which part of the arcade they're in. */
export function ZoneChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200 backdrop-blur',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]" />
      {children}
    </span>
  );
}

/** A full-width band of page content that sits "inside" a zone of the 3D world. */
export function Zone({
  children,
  className,
  id,
  chip,
  align = 'wide',
  min = 'min-h-[70vh]',
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  chip?: string;
  align?: 'left' | 'right' | 'center' | 'wide';
  min?: string;
}) {
  return (
    <section id={id} className={cn('relative flex items-center px-4 py-20 sm:px-6 lg:px-12', min, className)}>
      <div
        className={cn(
          'mx-auto w-full max-w-7xl',
          align === 'left' && 'lg:mr-auto lg:max-w-3xl xl:ml-24',
          align === 'right' && 'lg:ml-auto lg:max-w-3xl',
          align === 'center' && 'max-w-4xl text-center'
        )}
      >
        {chip && <ZoneChip className="mb-5">{chip}</ZoneChip>}
        {children}
      </div>
    </section>
  );
}

/** Full-screen opening of a page: giant display heading over the 3D world. */
export function ZoneHero({
  crumbs,
  chip,
  title,
  description,
  children,
  align = 'left',
  className,
}: {
  crumbs?: React.ReactNode;
  chip?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <section
      className={cn(
        'relative flex min-h-[88vh] items-center px-4 pb-16 pt-32 sm:px-6 lg:px-12',
        className
      )}
    >
      <div className={cn('mx-auto w-full max-w-7xl', align === 'center' && 'text-center')}>
        <div className={cn(align === 'left' ? 'max-w-3xl xl:ml-24' : 'mx-auto max-w-4xl')}>
          {crumbs && <div className="mb-5 text-xs text-white/70">{crumbs}</div>}
          {chip && <ZoneChip className="mb-6">{chip}</ZoneChip>}
          <h1 className="text-shadow-soft mb-6 text-5xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">{title}</h1>
          {description && (
            <div className="text-shadow-soft mb-9 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">{description}</div>
          )}
          {children}
        </div>
      </div>
      <div aria-hidden className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 lg:flex">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll to explore</span>
        <span className="relative h-10 w-6 rounded-full border border-white/40">
          <span className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 animate-bounce rounded-full bg-orange-400" />
        </span>
      </div>
    </section>
  );
}

/** Glass panel for readable content floating over the world. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('glass rounded-3xl', className)}>{children}</div>;
}
