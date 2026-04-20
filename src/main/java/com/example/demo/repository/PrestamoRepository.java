package com.example.demo.repository;
import com.example.demo.model.EstadoPrestamo;
import com.example.demo.model.Prestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrestamoRepository extends JpaRepository<Prestamo, Long> {
    int countByUsuarioIdAndEstadoIn(Long usuarioId, List<EstadoPrestamo> estados);
}