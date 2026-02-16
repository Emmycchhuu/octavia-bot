
/**
 * Octavia Local Brain: Converter Module
 * Handles Unit and Currency conversions locally.
 */

const RATES = {
    // Approximate Static Rates (Offline Mode)
    'usd': { 'ngn': 1500, 'eur': 0.92, 'gbp': 0.79 },
    'eur': { 'usd': 1.09, 'ngn': 1630 },
    'gbp': { 'usd': 1.26, 'ngn': 1900 },
    'ngn': { 'usd': 0.00067 }
};

const UNITS = {
    'kg': { 'lbs': 2.20462 },
    'lbs': { 'kg': 0.453592 },
    'km': { 'mi': 0.621371 },
    'mi': { 'km': 1.60934 },
    'c': { 'f': (c) => (c * 9 / 5) + 32 },
    'f': { 'c': (f) => (f - 32) * 5 / 9 }
};

function processConverter(query) {
    const clean = query.toLowerCase().replace(/,/g, '');

    // Pattern: "100 usd to ngn"
    const currencyMatch = clean.match(/(\d+(?:\.\d+)?)\s?([a-z]{3})\s?to\s?([a-z]{3})/);
    if (currencyMatch) {
        const val = parseFloat(currencyMatch[1]);
        const from = currencyMatch[2];
        const to = currencyMatch[3];

        if (RATES[from] && RATES[from][to]) {
            const result = (val * RATES[from][to]).toFixed(2);
            return `💱 *Currency (Approx):* ${val} ${from.toUpperCase()} = *${result} ${to.toUpperCase()}*`;
        }
    }

    // Pattern: "50 kg to lbs"
    const unitMatch = clean.match(/(\d+(?:\.\d+)?)\s?([a-z]+)\s?to\s?([a-z]+)/);
    if (unitMatch) {
        const val = parseFloat(unitMatch[1]);
        const from = unitMatch[2];
        const to = unitMatch[3];

        if (UNITS[from] && UNITS[from][to]) {
            let result;
            if (typeof UNITS[from][to] === 'function') {
                result = UNITS[from][to](val);
            } else {
                result = val * UNITS[from][to];
            }
            return `📏 *Conversion:* ${val}${from} = *${result.toFixed(2)}${to}*`;
        }
    }

    return null;
}

module.exports = { processConverter };
