package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.domain.NotificationKind;

public final class NotificationContentBuilder {

    private NotificationContentBuilder() {}

    public static String buildTitle(NotificationKind kind, String summary) {
        return switch (kind) {
            case DEAL_APPROVAL -> "Deal pending approval";
            case INVENTORY_CHANGE_APPROVAL -> "Inventory change pending approval";
        };
    }

    public static String buildBody(NotificationKind kind, String summary) {
        String safeSummary = summary != null && !summary.isBlank() ? summary : "Review required";
        return switch (kind) {
            case DEAL_APPROVAL -> "Deal pending approval: " + truncate(safeSummary, 400);
            case INVENTORY_CHANGE_APPROVAL -> "Inventory change: " + truncate(safeSummary, 400);
        };
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max - 3) + "...";
    }
}
