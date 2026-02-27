package br.com.horizon.portal.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Registra o módulo mágico que resolve o erro do LocalDate e LocalDateTime
        mapper.registerModule(new JavaTimeModule());
        
        // Formata as datas como Strings ISO-8601 (ex: "2024-02-19") em vez de arrays de números [2024, 2, 19]
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}