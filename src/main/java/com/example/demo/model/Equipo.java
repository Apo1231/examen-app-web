package com.example.demo.model;

import jakarta.persistence.*;

@Entity
public class Equipo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Enumerated(EnumType.STRING)
    private TipoEquipo tipo;

    private boolean disponible;

    public Long getId() {
        return id; }

    public void setId(Long id) {
        this.id = id; }

    public String getNombre() {
        return nombre; }

    public void setNombre(String nombre) {
        this.nombre = nombre; }

    public TipoEquipo getTipo() {
        return tipo; }

    public void setTipo(TipoEquipo tipo) {
        this.tipo = tipo; }

    public boolean isDisponible() {
        return disponible; }

    public void setDisponible(boolean disponible) {
        this.disponible = disponible; }
}