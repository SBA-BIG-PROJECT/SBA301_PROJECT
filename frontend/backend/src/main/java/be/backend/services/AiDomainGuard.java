package be.backend.services;

import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class AiDomainGuard {

    private static final Pattern PURE_CALCULATION =
            Pattern.compile(
                    "^\\s*[\\d\\s()+\\-*/%.]+\\s*$"
            );

    public boolean isClearlyOutOfDomain(String message) {

        if (message == null || message.isBlank()) {
            return false;
        }

        String text =
                message.trim()
                        .toLowerCase(Locale.ROOT);

        if (PURE_CALCULATION.matcher(text).matches()) {
            return true;
        }

        return containsAny(
                text,
                "viết code",
                "lập trình",
                "sửa code",
                "java spring",
                "thời tiết",
                "dự báo thời tiết",
                "chứng khoán",
                "tỷ giá",
                "bệnh gì",
                "thuốc gì",
                "giải phương trình",
                "tính giúp",
                "calculate",
                "weather",
                "stock price",
                "programming"
        );
    }

    private boolean containsAny(
            String text,
            String... values) {

        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }

        return false;
    }
}

