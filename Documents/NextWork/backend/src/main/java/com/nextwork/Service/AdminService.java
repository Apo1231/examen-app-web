package com.nextwork.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.nextwork.Dto.CreateTeacherRequest;
import com.nextwork.Dto.UpdateTeacherRequest;
import com.nextwork.Dto.UpdateStudentRequest;
import com.nextwork.Dto.UserDTO;
import com.nextwork.Excepcion.BusinessException;
import com.nextwork.Excepcion.ResourceNotFoundException;
import com.nextwork.Model.entity.Cita;
import com.nextwork.Model.entity.Rol;
import com.nextwork.Model.entity.Usuario;
import com.nextwork.Model.enums.EstadoCita;
import com.nextwork.Model.enums.Modalidad;
import com.nextwork.Service.Repository.CitaRepository;
import com.nextwork.Service.Repository.RolRepository;
import com.nextwork.Service.Repository.UsuarioRepository;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final String ROL_MAESTRO = "ROLE_MAESTRO";
    private static final String ROL_ALUMNO = "ROLE_ALUMNO";
    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CitaRepository citaRepository;
    private final PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────────
    // CREAR MAESTRO (BR-03: must_change_password = true)
    // ─────────────────────────────────────────────

    @Transactional
    public UserDTO crearMaestro(CreateTeacherRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya está registrado.");
        }

        Rol rolMaestro = rolRepository
            .findByNombreRol(ROL_MAESTRO)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Rol ROLE_MAESTRO no encontrado en la base de datos."
                )
            );

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException(
                "Debes ingresar una contraseña temporal para el maestro."
            );
        }

        Usuario maestro = new Usuario();
        maestro.setNombres(request.getNombres());
        maestro.setApellidos(request.getApellidos());
        maestro.setCorreo(request.getCorreo());
        maestro.setPassword(passwordEncoder.encode(request.getPassword()));
        maestro.setTelefono(request.getTelefono());
        maestro.setRol(rolMaestro);
        maestro.setActivo(true);
        maestro.setIntentosFallidos(0);
        maestro.setMustChangePassword(true); // BR-03

        Usuario guardado = usuarioRepository.save(maestro);
        return toUserDTO(guardado);
    }

    // ─────────────────────────────────────────────
    // EDITAR MAESTRO
    // ─────────────────────────────────────────────

    @Transactional
    public UserDTO editarMaestro(Long idMaestro, UpdateTeacherRequest request) {
        Usuario maestro = usuarioRepository
            .findById(idMaestro)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Maestro no encontrado con id: " + idMaestro
                )
            );

        if (!ROL_MAESTRO.equals(maestro.getRol().getNombreRol())) {
            throw new BusinessException(
                "El usuario especificado no es un maestro."
            );
        }

        if (
            !maestro.getCorreo().equalsIgnoreCase(request.getCorreo()) &&
            usuarioRepository.existsByCorreo(request.getCorreo())
        ) {
            throw new BusinessException(
                "El nuevo correo ya está en uso por otro usuario."
            );
        }

        maestro.setNombres(request.getNombres());
        maestro.setApellidos(request.getApellidos());
        maestro.setCorreo(request.getCorreo());
        maestro.setTelefono(request.getTelefono());

        Usuario actualizado = usuarioRepository.save(maestro);
        return toUserDTO(actualizado);
    }

    // ─────────────────────────────────────────────
    // EDITAR ALUMNO
    // ─────────────────────────────────────────────

    @Transactional
    public UserDTO editarAlumno(Long idAlumno, UpdateStudentRequest request) {
        Usuario alumno = usuarioRepository
            .findById(idAlumno)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Alumno no encontrado con id: " + idAlumno
                )
            );

        if (!ROL_ALUMNO.equals(alumno.getRol().getNombreRol())) {
            throw new BusinessException(
                "El usuario especificado no es un alumno."
            );
        }

        if (
            !alumno.getCorreo().equalsIgnoreCase(request.getCorreo()) &&
            usuarioRepository.existsByCorreo(request.getCorreo())
        ) {
            throw new BusinessException(
                "El nuevo correo ya está en uso por otro usuario."
            );
        }

        alumno.setNombres(request.getNombres());
        alumno.setApellidos(request.getApellidos());
        alumno.setCorreo(request.getCorreo());
        alumno.setTelefono(request.getTelefono());
        alumno.setTelefonoEmergencia(request.getTelefonoEmergencia());
        alumno.setParentesco(request.getParentesco());

        Usuario actualizado = usuarioRepository.save(alumno);
        return toUserDTO(actualizado);
    }

    // ─────────────────────────────────────────────
    // DESACTIVAR MAESTRO (baja lógica)
    // ─────────────────────────────────────────────

    @Transactional
    public void desactivarMaestro(Long idMaestro) {
        Usuario maestro = usuarioRepository
            .findById(idMaestro)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Maestro no encontrado con id: " + idMaestro
                )
            );

        if (!ROL_MAESTRO.equals(maestro.getRol().getNombreRol())) {
            throw new BusinessException(
                "El usuario especificado no es un maestro."
            );
        }

        maestro.setActivo(false);
        usuarioRepository.save(maestro);
    }

    // ─────────────────────────────────────────────
    // RESET DE CONTRASEÑA (genera temporal y fuerza cambio)
    // ─────────────────────────────────────────────

    @Transactional
    public String resetPassword(Long idUsuario) {
        Usuario usuario = usuarioRepository
            .findById(idUsuario)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Usuario no encontrado con id: " + idUsuario
                )
            );

        String passwordTemporal = UUID.randomUUID().toString().substring(0, 12);
        usuario.setPassword(passwordEncoder.encode(passwordTemporal));
        usuario.setMustChangePassword(true);
        usuario.setIntentosFallidos(0);
        usuario.setActivo(true); // desbloquear cuenta si estaba bloqueada

        usuarioRepository.save(usuario);
        return passwordTemporal;
    }

    // ─────────────────────────────────────────────
    // LISTADO DE USUARIOS (con filtro opcional por nombre/apellido)
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserDTO> listarUsuarios(String nombre) {
        List<Usuario> usuarios;

        if (nombre != null && !nombre.isBlank()) {
            usuarios =
                usuarioRepository.findByNombresContainingIgnoreCaseOrApellidosContainingIgnoreCase(
                    nombre,
                    nombre
                );
        } else {
            usuarios = usuarioRepository.findAll();
        }

        return usuarios
            .stream()
            .map(this::toUserDTO)
            .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // REPORTE PDF DE CITAS (BR-04: solo admin)
    // Filtra por los mismos parámetros del historial
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generarReportePdf(
        Long idAlumno,
        Long idMaestro,
        LocalDateTime desde,
        LocalDateTime hasta,
        EstadoCita estado,
        Modalidad modalidad
    ) {
        List<Cita> citas = obtenerCitasFiltradas(
            idAlumno,
            idMaestro,
            desde,
            hasta,
            estado,
            modalidad
        );

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document documento = new Document(
                PageSize.A4.rotate(),
                28f,
                28f,
                28f,
                28f
            );
            PdfWriter.getInstance(documento, baos);
            documento.open();

            Font fuenteTitulo = new Font(
                Font.HELVETICA,
                18,
                Font.BOLD,
                new Color(17, 24, 39)
            );
            Font fuenteSubtitulo = new Font(
                Font.HELVETICA,
                10,
                Font.NORMAL,
                new Color(75, 85, 99)
            );
            Font fuenteTexto = new Font(
                Font.HELVETICA,
                9,
                Font.NORMAL,
                new Color(17, 24, 39)
            );
            Font fuenteEncabezado = new Font(
                Font.HELVETICA,
                9,
                Font.BOLD,
                Color.WHITE
            );

            Paragraph titulo = new Paragraph(
                "NextWork - Reporte Profesional de Citas",
                fuenteTitulo
            );
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(4f);
            documento.add(titulo);

            Paragraph subtitulo = new Paragraph(
                "Emitido: " + LocalDateTime.now().format(FORMATTER),
                fuenteSubtitulo
            );
            subtitulo.setAlignment(Element.ALIGN_CENTER);
            subtitulo.setSpacingAfter(14f);
            documento.add(subtitulo);

            PdfPTable resumen = new PdfPTable(2);
            resumen.setWidthPercentage(100);
            resumen.setWidths(new float[] { 1.5f, 4.5f });

            agregarCeldaResumen(
                resumen,
                "Total de registros",
                String.valueOf(citas.size()),
                fuenteTexto
            );
            agregarCeldaResumen(
                resumen,
                "Filtros aplicados",
                construirResumenFiltros(
                    idAlumno,
                    idMaestro,
                    desde,
                    hasta,
                    estado,
                    modalidad
                ),
                fuenteTexto
            );
            resumen.setSpacingAfter(14f);
            documento.add(resumen);

            float[] columnasPdf = new float[] {
                2.3f,
                2.3f,
                1.8f,
                1.2f,
                1.2f,
                1.1f,
                1.4f,
                1.4f,
                1.9f,
            };

            PdfPTable tabla = new PdfPTable(columnasPdf.length);
            tabla.setWidthPercentage(100);
            tabla.setWidths(columnasPdf);

            String[] encabezados = {
                "Alumno",
                "Maestro",
                "Fecha",
                "Inicio",
                "Fin",
                "Duración",
                "Modalidad",
                "Estado",
                "Ubicación",
            };
            Color colorEncabezado = new Color(30, 64, 175);

            for (String enc : encabezados) {
                PdfPCell celda = new PdfPCell(
                    new Phrase(enc, fuenteEncabezado)
                );
                celda.setBackgroundColor(colorEncabezado);
                celda.setHorizontalAlignment(Element.ALIGN_CENTER);
                celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
                celda.setPadding(7f);
                tabla.addCell(celda);
            }

            boolean filaPar = false;
            Color colorPar = new Color(243, 244, 246);

            for (Cita cita : citas) {
                Color bgFila = filaPar ? colorPar : Color.WHITE;
                String fecha = cita
                    .getHoraInicio()
                    .toLocalDate()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                String horaInicio = cita
                    .getHoraInicio()
                    .toLocalTime()
                    .format(DateTimeFormatter.ofPattern("HH:mm"));
                String horaFin = cita
                    .getHoraFin()
                    .toLocalTime()
                    .format(DateTimeFormatter.ofPattern("HH:mm"));

                agregarCelda(
                    tabla,
                    nombreCompleto(cita.getAlumno()),
                    fuenteTexto,
                    bgFila
                );
                agregarCelda(
                    tabla,
                    nombreCompleto(cita.getMaestro()),
                    fuenteTexto,
                    bgFila
                );
                agregarCelda(tabla, fecha, fuenteTexto, bgFila);
                agregarCelda(tabla, horaInicio, fuenteTexto, bgFila);
                agregarCelda(tabla, horaFin, fuenteTexto, bgFila);
                agregarCelda(
                    tabla,
                    cita.getDuracion() + " min",
                    fuenteTexto,
                    bgFila
                );
                agregarCelda(
                    tabla,
                    formatModalidad(cita.getModalidad()),
                    fuenteTexto,
                    bgFila
                );
                agregarCelda(
                    tabla,
                    formatEstado(cita.getEstado()),
                    fuenteTexto,
                    bgFila
                );
                agregarCelda(
                    tabla,
                    cita.getUbicacion() != null &&
                        !cita.getUbicacion().isBlank()
                        ? cita.getUbicacion()
                        : "-",
                    fuenteTexto,
                    bgFila
                );
                filaPar = !filaPar;
            }

            documento.add(tabla);

            Font fuentePie = new Font(
                Font.HELVETICA,
                8,
                Font.ITALIC,
                new Color(107, 114, 128)
            );
            Paragraph pie = new Paragraph(
                "Documento generado automaticamente por NextWork.",
                fuentePie
            );
            pie.setAlignment(Element.ALIGN_RIGHT);
            pie.setSpacingBefore(12f);
            documento.add(pie);

            documento.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new BusinessException(
                "Error al generar el reporte PDF: " + e.getMessage()
            );
        }
    }

    @Transactional(readOnly = true)
    public byte[] generarReporteExcel(
        Long idAlumno,
        Long idMaestro,
        LocalDateTime desde,
        LocalDateTime hasta,
        EstadoCita estado,
        Modalidad modalidad
    ) {
        List<Cita> citas = obtenerCitasFiltradas(
            idAlumno,
            idMaestro,
            desde,
            hasta,
            estado,
            modalidad
        );

        try (
            XSSFWorkbook workbook = new XSSFWorkbook();
            ByteArrayOutputStream baos = new ByteArrayOutputStream()
        ) {
            XSSFSheet sheet = workbook.createSheet("Reporte Citas");
            int rowIndex = 0;

            XSSFFont titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.LEFT);

            Row titleRow = sheet.createRow(rowIndex++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("NextWork - Reporte Profesional de Citas");
            titleCell.setCellStyle(titleStyle);

            Row metaRow = sheet.createRow(rowIndex++);
            metaRow
                .createCell(0)
                .setCellValue(
                    "Generado: " + LocalDateTime.now().format(FORMATTER)
                );

            Row filterRow = sheet.createRow(rowIndex++);
            filterRow
                .createCell(0)
                .setCellValue(
                    "Filtros: " +
                        construirResumenFiltros(
                            idAlumno,
                            idMaestro,
                            desde,
                            hasta,
                            estado,
                            modalidad
                        )
                );

            Row totalRow = sheet.createRow(rowIndex++);
            totalRow
                .createCell(0)
                .setCellValue("Total registros: " + citas.size());

            rowIndex++;

            String[] headers = {
                "Alumno",
                "Maestro",
                "Fecha",
                "Hora inicio",
                "Hora fin",
                "Duracion (min)",
                "Modalidad",
                "Estado",
                "Ubicacion",
            };

            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
            );
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle stripedStyle = workbook.createCellStyle();
            stripedStyle.cloneStyleFrom(dataStyle);
            stripedStyle.setFillForegroundColor(
                IndexedColors.GREY_25_PERCENT.getIndex()
            );
            stripedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(rowIndex++);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            for (int i = 0; i < citas.size(); i++) {
                Cita cita = citas.get(i);
                Row row = sheet.createRow(rowIndex++);
                CellStyle style = i % 2 == 0 ? dataStyle : stripedStyle;

                List<String> values = new ArrayList<>();
                values.add(nombreCompleto(cita.getAlumno()));
                values.add(nombreCompleto(cita.getMaestro()));
                values.add(
                    cita
                        .getHoraInicio()
                        .toLocalDate()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                );
                values.add(
                    cita
                        .getHoraInicio()
                        .toLocalTime()
                        .format(DateTimeFormatter.ofPattern("HH:mm"))
                );
                values.add(
                    cita
                        .getHoraFin()
                        .toLocalTime()
                        .format(DateTimeFormatter.ofPattern("HH:mm"))
                );
                values.add(String.valueOf(cita.getDuracion()));
                values.add(formatModalidad(cita.getModalidad()));
                values.add(formatEstado(cita.getEstado()));
                values.add(
                    cita.getUbicacion() != null &&
                        !cita.getUbicacion().isBlank()
                        ? cita.getUbicacion()
                        : "-"
                );

                for (int col = 0; col < values.size(); col++) {
                    Cell cell = row.createCell(col);
                    cell.setCellValue(values.get(col));
                    cell.setCellStyle(style);
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                int width = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.min(width + 700, 16000));
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new BusinessException(
                "Error al generar el reporte Excel: " + e.getMessage()
            );
        }
    }

    // ─────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────

    private void agregarCelda(
        PdfPTable tabla,
        String texto,
        Font fuente,
        Color bg
    ) {
        PdfPCell celda = new PdfPCell(
            new Phrase(texto != null ? texto : "", fuente)
        );
        celda.setHorizontalAlignment(Element.ALIGN_LEFT);
        celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
        celda.setBackgroundColor(bg);
        celda.setPadding(5f);
        tabla.addCell(celda);
    }

    private void agregarCeldaResumen(
        PdfPTable tabla,
        String etiqueta,
        String valor,
        Font fuente
    ) {
        PdfPCell key = new PdfPCell(
            new Phrase(
                etiqueta,
                new Font(Font.HELVETICA, 9, Font.BOLD, new Color(31, 41, 55))
            )
        );
        key.setBackgroundColor(new Color(229, 231, 235));
        key.setPadding(6f);
        key.setBorderColor(new Color(209, 213, 219));

        PdfPCell val = new PdfPCell(new Phrase(valor, fuente));
        val.setBackgroundColor(new Color(249, 250, 251));
        val.setPadding(6f);
        val.setBorderColor(new Color(209, 213, 219));

        tabla.addCell(key);
        tabla.addCell(val);
    }

    private List<Cita> obtenerCitasFiltradas(
        Long idAlumno,
        Long idMaestro,
        LocalDateTime desde,
        LocalDateTime hasta,
        EstadoCita estado,
        Modalidad modalidad
    ) {
        return citaRepository
            .findAll()
            .stream()
            .filter(
                c ->
                    idAlumno == null ||
                    c.getAlumno().getIdUsuario().equals(idAlumno)
            )
            .filter(
                c ->
                    idMaestro == null ||
                    c.getMaestro().getIdUsuario().equals(idMaestro)
            )
            .filter(c -> estado == null || c.getEstado() == estado)
            .filter(c -> modalidad == null || c.getModalidad() == modalidad)
            .filter(c -> desde == null || !c.getHoraInicio().isBefore(desde))
            .filter(c -> hasta == null || !c.getHoraInicio().isAfter(hasta))
            .sorted((a, b) -> a.getHoraInicio().compareTo(b.getHoraInicio()))
            .collect(Collectors.toList());
    }

    private String construirResumenFiltros(
        Long idAlumno,
        Long idMaestro,
        LocalDateTime desde,
        LocalDateTime hasta,
        EstadoCita estado,
        Modalidad modalidad
    ) {
        List<String> filtros = new ArrayList<>();

        if (idAlumno != null) filtros.add("Alumno ID: " + idAlumno);
        if (idMaestro != null) filtros.add("Maestro ID: " + idMaestro);
        if (desde != null) filtros.add("Desde: " + desde.format(FORMATTER));
        if (hasta != null) filtros.add("Hasta: " + hasta.format(FORMATTER));
        if (estado != null) filtros.add("Estado: " + formatEstado(estado));
        if (modalidad != null) filtros.add(
            "Modalidad: " + formatModalidad(modalidad)
        );

        if (
            filtros.isEmpty()
        ) return "Sin filtros (se incluyen todos los registros).";
        return String.join(" | ", filtros);
    }

    private String formatModalidad(Modalidad modalidad) {
        return modalidad == Modalidad.PRESENCIAL ? "Presencial" : "Virtual";
    }

    private String formatEstado(EstadoCita estado) {
        return switch (estado) {
            case Agendada -> "Agendada";
            case Cancelada -> "Cancelada";
            case Completada -> "Completada";
            case Reagendada -> "Reagendada";
        };
    }

    private String nombreCompleto(Usuario usuario) {
        if (usuario == null) return "";
        return usuario.getNombres() + " " + usuario.getApellidos();
    }

    private UserDTO toUserDTO(Usuario usuario) {
        return new UserDTO(
            usuario.getIdUsuario(),
            usuario.getNombres(),
            usuario.getApellidos(),
            usuario.getCorreo(),
            usuario.getTelefono(),
            usuario.getTelefonoEmergencia(),
            usuario.getParentesco(),
            usuario.getRol().getNombreRol(),
            usuario.getActivo(),
            usuario.getRegistroFecha()
        );
    }
}
