
interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="relative isolate mt-20 overflow-hidden px-4 py-20">
      
      <div className="mx-auto max-w-7xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">{title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-white/75 md:text-xl">{description}</p>
      </div>
    </div>
  );
}
