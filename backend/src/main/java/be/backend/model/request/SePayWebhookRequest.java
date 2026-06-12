package be.backend.model.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SePayWebhookRequest {
    private Long id;
    private String gateway;
    private String transactionDate;   // "yyyy-MM-dd HH:mm:ss"
    private String accountNumber;
    private String code;              // matched code if a pattern is configured in SePay
    private String content;           // raw transfer memo
    private String transferType;      // "in" | "out"
    private Long transferAmount;      // VND
    private Long accumulated;
    private String subAccount;
    private String referenceCode;     // bank reference (unique per transaction)
    private String description;
}