package com.smartpos.notificationsapprovals.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class ActionTokenServiceTest {

    @Test
    void hashTokenIsDeterministic() {
        byte[] a = ActionTokenService.hashToken("sample-token-value");
        byte[] b = ActionTokenService.hashToken("sample-token-value");
        assertArrayEquals(a, b);
    }

    @Test
    void hashTokenDiffersForDifferentInputs() {
        byte[] a = ActionTokenService.hashToken("accept-token");
        byte[] b = ActionTokenService.hashToken("reject-token");
        assertNotNull(a);
        assertNotEquals(0, a.length);
        assertNotEquals(java.util.Arrays.toString(a), java.util.Arrays.toString(b));
    }
}
