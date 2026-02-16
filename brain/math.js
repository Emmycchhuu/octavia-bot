
/**
 * Octavia Local Brain: Math Module
 * Handles basic arithmetic locally to save API calls.
 */

function solveMath(expression) {
    // strict regex to only allow numbers and math operators
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) return null;

    try {
        // Safe evaluation
        const result = Function('"use strict";return (' + expression + ')')();
        if (!isFinite(result) || isNaN(result)) return null;
        return `🧮 *Math Result:* ${result}`;
    } catch (e) {
        return null;
    }
}

module.exports = { solveMath };
