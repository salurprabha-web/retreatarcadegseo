
import { Service } from '../types';

export const getSimpleSeoScore = (service: Service): number => {
    let score = 0;
    const { metaTitle, metaDescription } = service.seo;

    // Title length score (Optimal: 10-60)
    if (metaTitle.length >= 10 && metaTitle.length <= 60) {
        score += 35;
    } else if (metaTitle.length > 0) {
        score += 15;
    }

    // Description length score (Optimal: 70-160)
    if (metaDescription.length >= 70 && metaDescription.length <= 160) {
        score += 35;
    } else if (metaDescription.length > 0) {
        score += 15;
    }
    
    // Product schema presence score
    if (service.product_schema && service.product_schema.trim().length > 20) {
        score += 30;
    }
    
    return Math.min(100, score);
};
