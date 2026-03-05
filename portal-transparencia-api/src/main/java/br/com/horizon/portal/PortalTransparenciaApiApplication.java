package br.com.horizon.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync; 

@SpringBootApplication
@EnableAsync 
public class PortalTransparenciaApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortalTransparenciaApiApplication.class, args);
    }

}