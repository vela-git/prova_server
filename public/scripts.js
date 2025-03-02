// Selettori
const scanBtn = document.getElementById('scan-btn');
const camera = document.getElementById('camera');

// Variabile per conservare il media stream
let stream = null;

/**
 * Avvia la fotocamera usando getUserMedia
 */
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    camera.srcObject = stream;
  } catch (err) {
    console.error("Errore nell'accedere alla fotocamera:", err);
  }
}

/**
 * Cattura un frame dal video e lo invia al server
 */
// Esempio minimal di `captureAndSendFrame`
/**
 * Cattura un frame dal video e lo invia al server
 */
async function captureAndSendFrame() {
    try {
        // Creazione di un canvas per catturare un frame dal video
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Imposta la dimensione del canvas in base al video
        canvas.width = camera.videoWidth || camera.clientWidth;
        canvas.height = camera.videoHeight || camera.clientHeight;

        // Disegna il frame della fotocamera nel canvas
        context.drawImage(camera, 0, 0, canvas.width, canvas.height);

        // Converte l'immagine in base64
        const dataURL = canvas.toDataURL('image/jpeg');  // Ora è definito!

        // Invio al server
        const response = await fetch('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataURL }) // Invio dell'immagine
        });

        const result = await response.json();
        console.log("Risposta dal server:", result);

        // Controllo del nome della carta
        if (result.cardName === 'Tagging') {
            window.location.href = '/Schermate/tagging.html';
            return;
        }

        if (result.cardName === 'SqualoMartello') {
            alert("Carta: Squalo Martello!");
        } else {
            alert("Carta non riconosciuta o errore.");
        }

    } catch (error) {
        console.error("Errore durante la POST:", error);
    }
}


/**
 * Gestore del click sul pulsante
 */
scanBtn.addEventListener('click', async () => {
  // Se la fotocamera non è ancora avviata, la avviamo
  if (!stream) {
    await startCamera();
  } else {
    // Altrimenti catturiamo e inviamo subito il frame
    captureAndSendFrame();
  }
});
