
/**
 * Octavia Local Brain: Dev Dictionary
 * Definitions for complex tech terms.
 */

const DICTIONARY = {
    'idempotency': "The property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.",
    'closure': "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment).",
    'recursion': "See 'recursion'. Just kidding! It's when a function calls itself to solve a smaller instance of the problem.",
    'big o notation': "A mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity. Used to classify algorithms by how they respond to changes in input size.",
    'api': "Application Programming Interface. A set of functions and procedures allowing the creation of applications that access the features or data of an operating system, application, or other service.",
    'jwt': "JSON Web Token. A compact, URL-safe means of representing claims to be transferred between two parties.",
    'webhook': "A method of augmenting or altering the behavior of a web page or web application with custom callbacks.",
    'ci/cd': "Continuous Integration and Continuous Delivery/Deployment. A method to frequently deliver apps to customers by introducing automation into the stages of app development.",
    'docker': "A set of platform as a service (PaaS) products that use OS-level virtualization to deliver software in packages called containers.",
    'kubernetes': "An open-source container orchestration system for automating software deployment, scaling, and management."
};

function processDictionary(message) {
    const clean = message.toLowerCase().trim();

    // "Define X" or "What is X"
    const match = clean.match(/^(define|what is|meaning of) ([a-z\s/]+)/);
    if (match) {
        const term = match[2].trim();
        if (DICTIONARY[term]) {
            return `📖 *Definition:* \n**${term.toUpperCase()}**: ${DICTIONARY[term]}`;
        }
    }

    return null;
}

module.exports = { processDictionary };
