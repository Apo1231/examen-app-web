package com.nextwork.Config;

import com.nextwork.Utilities.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Si no hay Bearer token, continuar sin autenticar
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // Si el token no es válido, continuar sin autenticar
        // (Spring Security bloqueará el acceso a rutas protegidas)
        if (!jwtUtil.esValido(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Token válido: extraer identidad y ponerla en el SecurityContext
        String correo = jwtUtil.extraerCorreo(token);
        String rol = jwtUtil.extraerRol(token);
        Long idUsuario = jwtUtil.extraerIdUsuario(token);

        // Spring Security usa "ROLE_" como prefijo internamente.
        // El rol en el token ya viene como "ROLE_ALUMNO", etc.
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        correo,
                        null,
                        List.of(new SimpleGrantedAuthority(rol))
                );

        // Guardar idUsuario en details para que los controllers lo lean sin
        // necesidad de re-parsear el JWT
        authentication.setDetails(Map.of("idUsuario", idUsuario));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
