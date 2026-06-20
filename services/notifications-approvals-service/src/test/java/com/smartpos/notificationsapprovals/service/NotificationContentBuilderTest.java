package com.smartpos.notificationsapprovals.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.smartpos.notificationsapprovals.domain.NotificationKind;
import org.junit.jupiter.api.Test;

class NotificationContentBuilderTest {

    @Test
    void bodyContainsBusinessContextOnly() {
        String body = NotificationContentBuilder.buildBody(
                NotificationKind.DEAL_APPROVAL, "15% off coffee");
        assertTrue(body.contains("15% off coffee"));
        assertFalse(body.toLowerCase().contains("customer"));
        assertFalse(body.toLowerCase().contains("phone"));
    }
}
