
import { Service } from '../types';

export const getSimpleSeoScore = (service: Service): number => {
    let score = 0;
    const { metaTitle, metaDescription } = service.seo;

    // Title length score (Optimal: 10-60)
    if (metaTitle.length >= 10 && metaTitle.length <= 60) {
        score += 50;
    } else if (metaTitle.length > 0) {
        score += 25;
    }

    // Description length score (Optimal: 70-160)
    if (metaDescription.length >= 70 && metaDescription.length <= 160) {
        score += 50;
    } else if (metaDescription.length > 0) {
        score += 25;
    }
    
    return score;
};
