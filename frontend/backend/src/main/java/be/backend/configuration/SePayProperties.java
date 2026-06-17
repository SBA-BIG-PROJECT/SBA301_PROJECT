package be.backend.configuration;



import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;


@Component
@ConfigurationProperties(prefix = "sepay")
@Getter
@Setter
public class SePayProperties {

    /** Your bank account number registered in SePay. */
    private String accountNumber;

    /** Account holder name (for display on the transfer screen). */
    private String accountName;

    /** Bank short name or BIN used by VietQR, e.g. "Vietcombank", "TPBank", "MBBank". */
    private String bank;

    /** Webhook API key — SePay sends it as "Authorization: Apikey <key>". */
    private String apiKey;

    /** Prefix prepended to the order code in the transfer content, e.g. "MOVIE". */
    private String prefix = "MOVIE";

    /** VietQR image endpoint. */
    private String qrBaseUrl = "https://qr.sepay.vn/img";
}