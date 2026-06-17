package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastMemberDto {
    private Integer personId;
    private String name;
    private String profilePath;
    private String role;          // ACTOR, DIRECTOR...
    private String characterName;
    private Integer castOrder;
}