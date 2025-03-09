document.addEventListener('DOMContentLoaded', () => {
  // Sezione Loading: transizione del logo
  const logoLoading = document.getElementById('logo-loading');
  const loadingSection = document.getElementById('loading');
  
  // Al click sul logo della loading page
  logoLoading.addEventListener('click', () => {
    // Aggiunge la classe per innescare la transizione (rimpicciolimento e spostamento)
    logoLoading.classList.add('transition');
    
    // Quando la transizione finisce, nascondi la sezione di loading
    logoLoading.addEventListener('transitionend', () => {
      loadingSection.style.display = 'none';
    }, { once: true });
  });

  // Aggiunge il listener sul pulsante "bimba1" per navigare a "autori.html"
  const bimba1 = document.getElementById('bimba1');
  if (bimba1) {
    bimba1.addEventListener('click', () => {
      window.location.href = 'autori.html';
    });
  }

  // Aggiunge il listener sul pulsante "bimba2" per navigare a "copyright.html"
  const bimba2 = document.getElementById('bimba2');
  if (bimba2) {
    bimba2.addEventListener('click', () => {
      window.location.href = 'copyrights.html';
    });
  }
});


// Selettori
const cameraIcon = document.getElementById('camera-icon');
const camera = document.getElementById('camera');        // <video id="camera" ...> in HTML
const cardDisplay = document.getElementById('card-display'); // <img id="card-display" ...> in HTML

// Variabile per conservare il media stream
let stream = null;

/**
 * Avvia la fotocamera usando getUserMedia
 */
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("Il browser non supporta getUserMedia.");
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    // Collega lo stream al <video id="camera">
    camera.srcObject = stream;
    camera.style.display = 'block'; // se vuoi mostrarlo a schermo
  } catch (err) {
    console.error("Errore nell'accedere alla fotocamera:", err);
  }
}

/**
 * Cattura un frame e lo invia al server
 */
async function captureAndSendFrame() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Imposta le dimensioni del canvas in base al video
    canvas.width = camera.videoWidth || camera.clientWidth;
    canvas.height = camera.videoHeight || camera.clientHeight;

    // Disegna il frame corrente del video sul canvas
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);

    // Converte il contenuto del canvas in Base64 (JPEG)
    const dataURL = canvas.toDataURL('image/jpeg');

    // Invia al server
    const response = await fetch('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataURL })
    });

    const result = await response.json();
    console.log("Risposta dal server:", result);

    // Se il server risponde con un nome di carta
    if (result.cardName) {
      // Nascondi il video e interrompi lo stream
      camera.style.display = "none";
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Mostra l'immagine della carta
      cardDisplay.src = `/Illustrazioni/${result.cardName}.jpg`; 
      cardDisplay.style.display = "block"; 
    }

  } catch (error) {
    console.error("Errore durante la POST:", error);
  }
}

/**
 * Gestore del click/touch sull'icona fotocamera
 */
async function handleCameraIconClick() {
  // Se la fotocamera non è ancora avviata, la avviamo
  if (!stream) {
    await startCamera();
  } else {
    // Altrimenti catturiamo e inviamo il frame
    captureAndSendFrame();
  }
}

// Listener al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
  if (cameraIcon) {
    // Click
    cameraIcon.addEventListener('click', handleCameraIconClick);
    // Touch (per mobile)
    cameraIcon.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleCameraIconClick();
    });
  }
});

