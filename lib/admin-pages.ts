import { NAV_ITEMS } from '@/constants';

interface PageSlugInfo {
    name: string;
    slug: string;
    icon: React.ReactNode;
}

export const pageSlugs: PageSlugInfo[] = NAV_ITEMS.map(item => ({
    name: item.name,
    slug: item.name === 'Dashboard' ? 'dashboard' : item.name.toLowerCase().replace(/\s+/g, '-'),
    icon: item.icon
}));

export const getPageBySlug = (slug: string): PageSlugInfo | undefined => {
    return pageSlugs.find(p => p.slug === slug);
};

export const getSlugByName = (name: string): string | undefined => {
    return pageSlugs.find(p => p.name === name)?.slug;
}
