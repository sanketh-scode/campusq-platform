package com.campusq.config;

import com.campusq.service.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String allowedOriginsCsv) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOrigins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type")
        );
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider authenticationProvider) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Stateless JWT Bearer token API (no session cookies), so CSRF protection is disabled
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                            "{\"timestamp\":\"" + LocalDateTime.now()
                                    + "\",\"status\":401,\"error\":\"Unauthorized\","
                                    + "\"message\":\"Authentication is required to access this resource\"}"
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                            "{\"timestamp\":\"" + LocalDateTime.now()
                                    + "\",\"status\":403,\"error\":\"Forbidden\","
                                    + "\"message\":\"You do not have permission to access this resource\"}"
                    );
                })
            )
            .authenticationProvider(authenticationProvider)
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(HttpMethod.GET, "/api/colleges").permitAll()
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/auth/login",
                        "/api/students/register",
                        "/api/vendors/register"
                ).permitAll()

                // Super Admin endpoints
                .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")

                // College Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Vendor self-management & product endpoints
                .requestMatchers("/api/vendor/**").hasRole("VENDOR")

                // Student vendor & product browsing
                .requestMatchers(HttpMethod.GET, "/api/vendors").hasRole("STUDENT")
                .requestMatchers("/api/products/**").hasRole("STUDENT")

                // Vendor order endpoints (must precede /api/orders/**)
                .requestMatchers("/api/orders/vendor/**").hasRole("VENDOR")
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/status").hasRole("VENDOR")

                // Student order endpoints
                .requestMatchers("/api/orders/**").hasRole("STUDENT")

                .anyRequest().authenticated()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            )
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable());

        return http.build();
    }
}
