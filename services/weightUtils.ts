
/**
 * Utility for formatting weights according to animal preference.
 * Specifically handles Grams, Ounces, and Lbs/Oz with eighths.
 * Hardened against null/undefined/NaN inputs.
 */
export const formatWeightDisplay = (grams: number | undefined | null, unit: 'g' | 'oz' | 'lbs_oz' = 'g') => {
    // 1. Hardened Input Check
    if (grams === undefined || grams === null || typeof grams !== 'number' || Number.isNaN(grams) || !Number.isFinite(grams)) {
        return '';
    }
    
    // 2. Safe Rounding
    if (unit === 'g') {
        return `${Math.round(grams)}g`;
    }

    // Conversion: 1 gram = 0.035274 ounces
    const totalOz = grams * 0.035274;
    const wholeOz = Math.floor(totalOz);
    const fraction = totalOz - wholeOz;
    
    // Falconry standard uses eighths of an ounce
    let eighths = Math.round(fraction * 8);
    let displayOz = wholeOz;
    let displayEighths = '';
    
    if (eighths === 8) {
        displayOz += 1;
    } else if (eighths > 0) {
        displayEighths = ` ${eighths}/8`;
    }

    if (unit === 'oz') {
        return `${displayOz}${displayEighths}oz`;
    }

    if (unit === 'lbs_oz') {
        const lbs = Math.floor(displayOz / 16);
        const remOz = displayOz % 16;
        if (lbs === 0) {
            return `${remOz}${displayEighths}oz`;
        }
        return `${lbs}lb ${remOz}${displayEighths}oz`;
    }

    // Fallback
    return `${Math.round(grams)}g`;
};

/**
 * Converts a numeric input value from the specified unit back to grams.
 * For 'lbs_oz', we assume the input is in total ounces if it's a single number field, 
 * but ideally the UI should provide two fields. If it's a single number, we treat it as ounces.
 */
export const parseWeightInputToGrams = (value: number, unit: 'g' | 'oz' | 'lbs_oz'): number => {
    if (unit === 'g') {
        return value;
    }
    // 1 ounce = 28.349523125 grams
    if (unit === 'oz' || unit === 'lbs_oz') {
        return value * 28.349523125;
    }
    return value;
};

