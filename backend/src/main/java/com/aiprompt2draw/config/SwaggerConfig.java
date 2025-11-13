package com.aiprompt2draw.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger API文档配置
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AIPrompt2Draw API")
                        .version("1.0.0")
                        .description("AI流程图生成器后端API文档")
                        .contact(new Contact()
                                .name("AIPrompt2Draw")
                                .email("support@aiprompt2draw.com")))
                .components(new Components()
                        .addSecuritySchemes("X-API-Key", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-API-Key")
                                .description("前端API Key认证"))
                        .addSecuritySchemes("Bearer", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("管理员JWT认证")))
                .addSecurityItem(new SecurityRequirement().addList("X-API-Key"))
                .addSecurityItem(new SecurityRequirement().addList("Bearer"));
    }
}
