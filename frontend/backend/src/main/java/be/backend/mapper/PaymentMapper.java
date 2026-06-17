package be.backend.mapper;

import be.backend.entity.Payment;
import be.backend.model.dto.PaymentDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;


@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "id", target = "paymentId")
    @Mapping(source = "user.id", target = "userId")
    PaymentDto toDto(Payment payment);

    List<PaymentDto> toDtoList(List<Payment> payments);
}