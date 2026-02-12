export class PolicyEngineError extends Error {
    name = 'PolicyEngineError';
}
export class PolicyRuleRegistrationError extends PolicyEngineError {
    name = 'PolicyRuleRegistrationError';
}
export class PolicyFailClosedError extends PolicyEngineError {
    name = 'PolicyFailClosedError';
    constructor(message) {
        super(message);
    }
}
