package com.hasintha.modbus.master.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS Configuration for the application.
 * This configuration applies to all controllers and endpoints.
 *
 * Uses WebMvcConfigurer interface for Spring Boot 6.x compatibility.
 *
 * Allows:
 * - All origins (can be restricted in production)
 * - Common HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH)
 * - All request headers
 * - Credentials in requests (configurable)
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Allow all origins (restrict to specific origins in production)
                .allowedOrigins("http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:8080")
                // Allow all HTTP methods
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                // Allow all request headers
                .allowedHeaders("*")
                // Expose these headers to the client
                .exposedHeaders("Content-Type", "Authorization", "X-Total-Count", "X-Page-Number")
                // Don't allow credentials (set to true if needed)
                .allowCredentials(false)
                // Cache preflight requests for 1 hour
                .maxAge(3600);
    }
}
