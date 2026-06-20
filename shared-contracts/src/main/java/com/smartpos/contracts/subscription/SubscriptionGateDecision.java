package com.smartpos.contracts.subscription;

/**
 * Decision returned by the subscription gate indicating whether a request should proceed.
 *
 * <p>The API gateway evaluates subscription status before forwarding business requests.
 * This decision determines whether the request is allowed, denied, or requires an upgrade.</p>
 *
 * @param action  the gate decision action
 * @param reason  human-readable explanation (null when ALLOW)
 */
public record SubscriptionGateDecision(Action action, String reason) {

    /**
     * Possible subscription gate actions.
     */
    public enum Action {
        /** Request is allowed to proceed. */
        ALLOW,
        /** Request is denied due to subscription issues. */
        DENY,
        /** Request is allowed in read-only mode (write operations blocked). */
        READ_ONLY,
        /** Request requires a plan upgrade to proceed. */
        UPGRADE_REQUIRED
    }

    /**
     * Creates an ALLOW decision.
     *
     * @return decision permitting the request
     */
    public static SubscriptionGateDecision allow() {
        return new SubscriptionGateDecision(Action.ALLOW, null);
    }

    /**
     * Creates a DENY decision with the given reason.
     *
     * @param reason explanation for the denial
     * @return decision blocking the request
     */
    public static SubscriptionGateDecision deny(String reason) {
        return new SubscriptionGateDecision(Action.DENY, reason);
    }

    /**
     * Creates a READ_ONLY decision with the given reason.
     *
     * @param reason explanation for read-only mode
     * @return decision limiting to read operations
     */
    public static SubscriptionGateDecision readOnly(String reason) {
        return new SubscriptionGateDecision(Action.READ_ONLY, reason);
    }

    /**
     * Creates an UPGRADE_REQUIRED decision with the given reason.
     *
     * @param reason explanation of what upgrade is needed
     * @return decision requiring plan upgrade
     */
    public static SubscriptionGateDecision upgradeRequired(String reason) {
        return new SubscriptionGateDecision(Action.UPGRADE_REQUIRED, reason);
    }
}
