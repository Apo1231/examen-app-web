package com.nextwork.Utilities;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtUtil(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
            secret.getBytes(StandardCharsets.UTF_8)
        );
        this.expirationMs = expirationMs;
    }

    // ─────────────────────────────────────────────
    // Generar token
    // Claims: sub=correo, rol, idUsuario
    // ─────────────────────────────────────────────

    public String generarToken(String correo, String rol, Long idUsuario) {
        return Jwts.builder()
            .subject(correo)
            .claim("rol", rol)
            .claim("idUsuario", idUsuario)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(secretKey)
            .compact();
    }

    // ─────────────────────────────────────────────
    // Extraer claims del token
    // ─────────────────────────────────────────────

    public Claims extraerClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String extraerCorreo(String token) {
        return extraerClaims(token).getSubject();
    }

    public String extraerRol(String token) {
        return extraerClaims(token).get("rol", String.class);
    }

    public Long extraerIdUsuario(String token) {
        Number id = (Number) extraerClaims(token).get("idUsuario");
        return id.longValue();
    }

    // ─────────────────────────────────────────────
    // Validar token (firma + expiración)
    // ─────────────────────────────────────────────

    public boolean esValido(String token) {
        try {
            Claims claims = extraerClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
