package com.smartpos.contracts.auth;

/**
 * Response from a permission verification check.
 *
 * @param granted whether the permission is granted
 * @param reason  explanation when denied (null when granted)
 */
public record PermissionCheckResponse(boolean granted, String reason) {

    /**
     * Creates a granted response.
     *
     * @return response indicating the permission is granted
     */
    public static PermissionCheckResponse allowed() {
        return new PermissionCheckResponse(true, null);
    }

    /**
     * Creates a denied response with the given reason.
     *
     * @param reason human-readable denial reason
     * @return response indicating the permission is denied
     */
    public static PermissionCheckResponse denied(String reason) {
        return new PermissionCheckResponse(false, reason);
    }
}
