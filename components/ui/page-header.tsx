interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-orange-100 to-amber-100 py-20 px-4 mt-20">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}
