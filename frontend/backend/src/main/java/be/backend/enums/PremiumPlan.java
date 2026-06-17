package be.backend.enums;

import java.time.Instant;
import java.time.ZoneId;

/**
 * Premium plans. Price is in VND (whole đồng). {@code label} is for display only.
 * Durations are calendar-based, so we add them through a fixed zone (Instant has
 * no notion of months/years).
 */
public enum PremiumPlan {

    MONTHLY(100_000, "Goi Premium 1 thang") {
        @Override
        public Instant addTo(Instant base) {
            return base.atZone(ZONE).plusMonths(1).toInstant();
        }
    },

    YEARLY(1_000_000, "Goi Premium 1 nam") {
        @Override
        public Instant addTo(Instant base) {
            return base.atZone(ZONE).plusYears(1).toInstant();
        }
    };

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final int price;
    private final String label;

    PremiumPlan(int price, String label) {
        this.price = price;
        this.label = label;
    }

    public int getPrice() {
        return price;
    }

    public String getLabel() {
        return label;
    }

    /** Returns the new expiry from a starting point (lets renewals stack). */
    public abstract Instant addTo(Instant base);
}