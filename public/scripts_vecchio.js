// Selettori
const scanBtn = document.getElementById('scan-btn');
const camera = document.getElementById('camera');
const cardDisplay = document.getElementById('card-display');

// Variabile per conservare il media stream
let stream = null;

// Avvia la fotocamera usando getUserMedia
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("Il browser non supporta getUserMedia.");
    return;
  }
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

// Gestore del click/touch sul pulsante
async function handleScan() {
  if (!stream) {
    await startCamera();
  } else {
    captureAndSendFrame();
  }
}

scanBtn.addEventListener('click', handleScan);
scanBtn.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Previene doppie attivazioni in alcuni dispositivi
  handleScan();
});

document.addEventListener('DOMContentLoaded', () => {
  // Simula il completamento della fase di caricamento (puoi sostituire questo con la logica effettiva)
  setTimeout(() => {
    // Avvia la transizione: nascondi il loading e mostra la homepage
    const loading = document.getElementById('loading');
    const homepage = document.getElementById('homepage');

    // Animazione di uscita per il loading
    loading.style.opacity = 0;
    
    // Dopo il fade-out del loading, mostra la homepage
    setTimeout(() => {
      homepage.style.opacity = 1;
      // Se vuoi, puoi anche rimuovere il loading dalla DOM
      loading.style.display = 'none';
    }, 1000); // deve essere uguale o superiore alla durata della transizione (1s in questo esempio)
  }, 2000); // Simula un tempo di caricamento di 2 secondi
});
