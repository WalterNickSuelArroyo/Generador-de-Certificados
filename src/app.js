const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Asegura que los archivos PDF sean accesibles públicamente
app.use('/certificados', express.static(path.join(__dirname, '../public/certificados')));

// Ruta para generar certificados
app.post('/generate-certificate', async (req, res) => {
    const { nombre, apellido } = req.body;

    if (!nombre || !apellido) {
        return res.status(400).send('Nombre y apellido son obligatorios');
    }

    try {
        // Cargar el PDF base
        const pdfPath = path.join(__dirname, 'templates', 'baseCertificate.pdf');
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Obtener la primera página del PDF
        const page = pdfDoc.getPage(0);

        // Agregar el texto al PDF
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fullName = `${nombre} ${apellido}`;
        page.drawText(fullName, {
            x: 50,
            y: 500, // Ajusta la posición según tu plantilla
            size: 24,
            font: helveticaFont,
            color: rgb(0, 0, 0)
        });

        // Generar el enlace que contendrá el código QR
        const pdfFileName = `${nombre}_${apellido}_certificado.pdf`.replace(/\s/g, '_');
        const qrData = `${req.protocol}://${req.get('host')}/certificados/${pdfFileName}`;
        const qrImage = await QRCode.toDataURL(qrData);

        // Insertar la imagen QR en el PDF
        const qrImageBytes = qrImage.split(',')[1]; // Eliminar 'data:image/png;base64,'
        const qrBuffer = Buffer.from(qrImageBytes, 'base64');
        const qrImageEmbed = await pdfDoc.embedPng(qrBuffer);
        page.drawImage(qrImageEmbed, {
            x: 50,
            y: 300, // Ajusta la posición según tu plantilla
            width: 150,
            height: 150
        });

        // Guardar el PDF modificado en el servidor
        const outputPath = path.join(__dirname, '../public/certificados', pdfFileName);
        const pdfBytesModified = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytesModified);

        // Responder con un mensaje de éxito y el enlace al PDF
        res.send({ message: 'Certificado generado con éxito', url: qrData });
    } catch (error) {
        console.error('Error al generar el certificado:', error);
        res.status(500).send('Error al generar el certificado');
    }
});

// Endpoint para mostrar el certificado (opcional, si quieres un HTML con más detalles)
app.get('/certificado/:nombre_apellido', (req, res) => {
    const [nombre, apellido] = req.params.nombre_apellido.split('_');

    if (!nombre || !apellido) {
        return res.status(400).send('Datos del certificado no válidos');
    }

    // Mostrar un mensaje básico con los detalles del certificado
    res.send(`
        <h1>Certificado de ${nombre} ${apellido}</h1>
        <p>Este es el certificado de ${nombre} ${apellido}. Puede acceder al PDF escaneando el código QR.</p>
        <a href="/certificados/${nombre}_${apellido}_certificado.pdf" target="_blank">Descargar Certificado</a>
    `);
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});