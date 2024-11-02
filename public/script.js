document.getElementById('certificateForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;

    try {
        const response = await fetch('http://localhost:3000/generate-certificate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, apellido })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nombre}_${apellido}_certificado.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            document.getElementById('message').textContent = 'Error al generar el certificado';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Error al comunicar con el servidor';
    }
});
