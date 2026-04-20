package com.nextwork.Service.Repository;

import com.nextwork.Model.entity.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    // Filtro por nombre o apellido (para admin)
    List<
        Usuario
    > findByNombresContainingIgnoreCaseOrApellidosContainingIgnoreCase(
        String nombres,
        String apellidos
    );

    // Listar maestros activos (para el alumno al reservar)
    List<Usuario> findByRolNombreRolAndActivoTrue(String nombreRol);
}
