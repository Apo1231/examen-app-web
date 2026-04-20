package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Prestamo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate fechaSolicitud;
    private LocalDate fechaDevolucion;

    //Un usuario → muchos préstamos
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
// Un equipo → muchos préstamos
    @ManyToOne
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    @Enumerated(EnumType.STRING)
    private EstadoPrestamo estado;

    public Long getId() {
        return id; }
    public void setId(Long id) {
        this.id = id; }
    public LocalDate getFechaSolicitud() {
        return fechaSolicitud; }
    public void setFechaSolicitud(LocalDate fechaSolicitud) {
        this.fechaSolicitud = fechaSolicitud; }
    public LocalDate getFechaDevolucion() {
        return fechaDevolucion; }
    public void setFechaDevolucion(LocalDate fechaDevolucion) {
        this.fechaDevolucion = fechaDevolucion; }
    public Usuario getUsuario() {
        return usuario; }
    public void setUsuario(Usuario usuario) {
        this.usuario = usuario; }
    public Equipo getEquipo() {
        return equipo; }
    public void setEquipo(Equipo equipo) {
        this.equipo = equipo; }
    public EstadoPrestamo getEstado() {
        return estado; }
    public void setEstado(EstadoPrestamo estado) {
        this.estado = estado; }
}