import { NAV_ITEMS } from '@/constants';

interface PageSlugInfo {
    name: string;
    slug: string;
    icon: React.ReactNode;
}

export const pageSlugs: PageSlugInfo[] = NAV_ITEMS.map(item => ({
    name: item.name,
    slug: item.name.toLowerCase().replace(/\s+/g, '-'),
    icon: item.icon
}));

export const getPageBySlug = (slug: string): PageSlugInfo | undefined => {
    if (slug === 'dashboard') return pageSlugs.find(p => p.name === 'Dashboard');
    return pageSlugs.find(p => p.slug === slug);
};

export const getSlugByName = (name: string): string | undefined => {
    return pageSlugs.find(p => p.name === name)?.slug;
}
