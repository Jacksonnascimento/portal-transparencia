package br.com.horizon.portal.infrastructure.adapter.in.rest.controller;

import br.com.horizon.portal.application.dto.faq.FaqDTO;
import br.com.horizon.portal.application.service.FaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/faqs")
@RequiredArgsConstructor
public class PortalFaqController {

    private final FaqService service;

    @GetMapping
    public ResponseEntity<Page<FaqDTO.Response>> listarPublico(
            @RequestParam(required = false) String busca,
            Pageable pageable) {
        return ResponseEntity.ok(service.listarPublico(busca, pageable));
    }
}