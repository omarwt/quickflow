package com.quickflow.common;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import java.time.Clock;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AppConfig implements WebMvcConfigurer {

    @Value("${quickflow.cors-origins}")
    private String[] corsOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(corsOrigins).allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
    }

    /** The only source of "now". Millisecond ticks so responses match what the database stores. */
    @Bean
    Clock clock() {
        return Clock.tick(Clock.systemUTC(), Duration.ofMillis(1));
    }

    @Bean
    OpenAPI openApi() {
        return new OpenAPI().info(new Info().title("QuickFlow API").version("1.0.0").description(
                "Single-user productivity API: tasks, habits, learning resources, plans, dashboard. "
                        + "Errors are RFC 7807 problem+json; validation errors list {field, message} in `errors`."));
    }
}
