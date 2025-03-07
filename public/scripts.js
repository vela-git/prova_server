// Selettori
const scanBtn = document.getElementById('scan-btn');
const camera = document.getElementById('camera');
const cardDisplay = document.getElementById('card-display');

// Variabile per conservare il media stream
let stream = null;

//Avvia la fotocamera usando getUserMedia
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    camera.srcObject = stream;
  } catch (err) {
    console.error("Errore nell'accedere alla fotocamera:", err);
  }
}

async function captureAndSendFrame() {
  try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = camera.videoWidth || camera.clientWidth;
      canvas.height = camera.videoHeight || camera.clientHeight;

      context.drawImage(camera, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg');

      // Invio al server
      const response = await fetch('/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataURL })
      });

      const result = await response.json();
      console.log("Risposta dal server:", result);

      if (result.cardName) {
          camera.style.display = "none";
          scanBtn.style.display = "none";
          stream.getTracks().forEach(track => track.stop());
    

          // Mostra l'immagine della carta
          cardDisplay.src = `/Illustrazioni/${result.cardName}.jpg`; 
          cardDisplay.style.display = "block"; 
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
