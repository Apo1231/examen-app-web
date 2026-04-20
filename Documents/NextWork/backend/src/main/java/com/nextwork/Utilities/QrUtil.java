package com.nextwork.Utilities;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.nextwork.Excepcion.BusinessException;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;

@Component
public class QrUtil {

    private static final int QR_SIZE = 300; // px

    // ─────────────────────────────────────────────
    // Genera un QR a partir del texto dado y
    // retorna la imagen PNG codificada en Base64.
    // Formato listo para usar en <img src="data:image/png;base64,...">
    // ─────────────────────────────────────────────

    public String generarQrBase64(String contenido) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(
                    contenido,
                    BarcodeFormat.QR_CODE,
                    QR_SIZE,
                    QR_SIZE,
                    Map.of(EncodeHintType.MARGIN, 1)
            );

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());

        } catch (WriterException | IOException e) {
            throw new BusinessException("Error al generar el código QR: " + e.getMessage());
        }
    }
}
