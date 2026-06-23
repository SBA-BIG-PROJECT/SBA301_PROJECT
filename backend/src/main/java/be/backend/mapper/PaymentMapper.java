package be.backend.mapper;

import be.backend.entity.Payment;
import be.backend.model.dto.PaymentDto;
import be.backend.model.dto.AdminPaymentDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;


@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "id", target = "paymentId")
    @Mapping(source = "user.id", target = "userId")
    PaymentDto toDto(Payment payment);

    @Mapping(source = "id", target = "paymentId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "user.fullName", target = "userFullName")
    AdminPaymentDto toAdminDto(Payment payment);

    List<PaymentDto> toDtoList(List<Payment> payments);
}