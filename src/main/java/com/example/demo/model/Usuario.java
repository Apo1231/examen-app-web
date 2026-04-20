package com.example.demo.model;

import jakarta.persistence.*;

@Entity
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String email;

    @Enumerated(EnumType.STRING)
    private TipoUsuario tipoUsuario;

    private boolean activo;

    public Long getId() {
        return id; }
    public void setId(Long id) {
        this.id = id; }
    public String getNombre() {
        return nombre; }
    public void setNombre(String nombre) {
        this.nombre = nombre; }
    public String getEmail() {
        return email; }
    public void setEmail(String email) {
        this.email = email; }
    public TipoUsuario getTipoUsuario() {
        return tipoUsuario; }
    public void setTipoUsuario(TipoUsuario tipoUsuario) {
        this.tipoUsuario = tipoUsuario; }
    public boolean isActivo() {

        return activo; }
    public void setActivo(boolean activo) {
        this.activo = activo; }
}