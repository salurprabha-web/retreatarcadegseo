import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden">
      
      <div className="px-4 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">Game over</p>
        <h1 className="mb-4 bg-gradient-to-br from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-8xl font-extrabold text-transparent md:text-9xl">
          404
        </h1>
        <h2 className="mb-4 text-2xl font-semibold text-white">Page Not Found</h2>
        <p className="mx-auto mb-8 max-w-md text-white/70">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-2xl bg-orange-500 px-8 py-3.5 font-bold text-white shadow-[0_10px_40px_-8px_rgba(194,65,12,0.8)] transition hover:-translate-y-0.5 hover:bg-orange-600"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
