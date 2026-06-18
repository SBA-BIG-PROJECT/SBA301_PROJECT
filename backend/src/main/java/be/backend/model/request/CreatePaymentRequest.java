package be.backend.model.request;

import be.backend.enums.PremiumPlan;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentRequest {

    @NotNull(message = "plan is required")
    private PremiumPlan plan = PremiumPlan.MONTHLY;
}