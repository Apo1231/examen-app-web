package com.nextwork.Config;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // ─────────────────────────────────────────────
    // PasswordEncoder — requerido por AuthService y AdminService
    // ─────────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ─────────────────────────────────────────────
    // CORS — permite llamadas desde el frontend React
    // en desarrollo: localhost:3000 y localhost:5173 (Vite)
    // ─────────────────────────────────────────────

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(
            List.of("http://localhost:3000", "http://localhost:5173")
        );
        config.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ─────────────────────────────────────────────
    // Cadena de seguridad HTTP
    // ─────────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
        throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth ->
                auth
                    // ── Rutas públicas ──
                    .requestMatchers(HttpMethod.POST, "/auth/login")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/register/alumno")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/oauth2callback")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/forgot-password")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/reset-password")
                    .permitAll()
                    // ── Requiere autenticación (cualquier rol) ──
                    .requestMatchers(HttpMethod.PUT, "/auth/change-password")
                    .authenticated()
                    .requestMatchers(HttpMethod.GET, "/teachers")
                    .authenticated()
                    // ── Slots: maestros gestionan su agenda ──
                    .requestMatchers("/slots/**")
                    .hasAnyRole("MAESTRO", "ADMIN")
                    // ── Citas: alumnos, maestros y admin ──
                    .requestMatchers("/appointments/**")
                    .hasAnyRole("ALUMNO", "MAESTRO", "ADMIN")
                    // ── Admin: solo rol ADMIN ──
                    .requestMatchers("/admin/**")
                    .hasRole("ADMIN")
                    // ── Todo lo demás requiere autenticación ──
                    .anyRequest()
                    .authenticated()
            )
            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
