package br.com.horizon.portal.application.dto.sic;

import br.com.horizon.portal.infrastructure.persistence.entity.SicTramiteEntity;
import br.com.horizon.portal.infrastructure.persistence.enums.SicStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SicTramiteResponseDTO {
    private Long id;
    private SicStatus status;
    private String descricao;
    private LocalDateTime dataTramite;
    private Long usuarioId;

    // Método facilitador para converter a Entidade em DTO
    public static SicTramiteResponseDTO fromEntity(SicTramiteEntity entity) {
        if (entity == null) return null;
        
        return SicTramiteResponseDTO.builder()
                .id(entity.getId())
                .status(entity.getStatus())
                .descricao(entity.getDescricao())
                .dataTramite(entity.getDataTramite())
                .usuarioId(entity.getUsuarioId())
                .build();
    }
}