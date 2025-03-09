document.addEventListener('DOMContentLoaded', () => {
  // SEZIONE LOADING: transizione del logo
  const logoLoading = document.getElementById('logo-loading');
  const loadingSection = document.getElementById('loading');
  
  logoLoading.addEventListener('click', () => {
    // Innesca la transizione (rimpicciolimento e spostamento)
    logoLoading.classList.add('transition');
    
    // Al termine della transizione, nasconde la sezione loading
    logoLoading.addEventListener('transitionend', () => {
      loadingSection.style.display = 'none';
    }, { once: true });
  });
  
  // Listener sul pulsante "bimba1" per navigare a autori.html
  const bimba1 = document.getElementById('bimba1');
  if (bimba1) {
    bimba1.addEventListener('click', () => {
      window.location.href = 'autori.html';
    });
  }
  
  // Listener sul pulsante "bimba2" per navigare a copyrights.html
  const bimba2 = document.getElementById('bimba2');
  if (bimba2) {
    bimba2.addEventListener('click', () => {
      window.location.href = 'copyrights.html';
    });
  }
  
  // SEZIONE FOTOCAMERA
  const cameraIcon = document.getElementById('camera-icon');
  const camera = document.getElementById('camera');         // <video id="camera"> in HTML
  const cardDisplay = document.getElementById('card-display'); // <img id="card-display"> in HTML
  const logoContainer = document.getElementById('logo-container');
  const bottomSection = document.getElementById('bottom-section');
  const camera_container = document.getElementById('camera-container');
  const cameraIcon2 = document.getElementById('camera-icon-2');
  let stream = null;
  
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Il browser non supporta getUserMedia.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: "environment"}, audio: false });
      camera.srcObject = stream;
      // Rendi visibile il video e impostalo in modo che occupi lo schermo
      camera_container.style.display = 'block';
      camera.style.display = 'block';
      cameraIcon2.style.display = 'block';
      camera.style.position = 'absolute';
      camera.style.top = '50%';
      camera.style.left = '50%';
      camera.style.transform = 'translate(-50%, -50%)';
      camera.style.aspectRatio = '9/16';
      camera.style.borderRadius = '8px';
      camera.style.width = '70%';      // oppure un valore fisso se preferisci
      camera.style.zIndex = '10';         // assicura che sia sopra gli altri elementi
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
      
      // Invia il frame al server
      const response = await fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
      });
      
      const result = await response.json();
      console.log("Risposta dal server:", result);
      
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
  
  async function handleCameraIconClick() {
    // Nascondi gli elementi non relativi alla fotocamera
    if (logoContainer) logoContainer.style.display = 'none';
    if (bottomSection) bottomSection.style.display = 'none';
    if (cameraIcon) cameraIcon.style.display = 'none';
    if (cameraIcon2) cameraIcon2.style.display = 'none';
        
    // Avvia la fotocamera o cattura un frame se già attiva
    if (!stream) {
      await startCamera();
    } else {
      console.log("Cattura e invia un frame");
      captureAndSendFrame();
    }
  }
  
  if (cameraIcon) {
    cameraIcon.addEventListener('click', handleCameraIconClick);
    cameraIcon.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleCameraIconClick();
    });
  }


  if (cameraIcon2){
    cameraIcon2.addEventListener('click', handleCameraIconClick);
    cameraIcon2.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleCameraIconClick();
    });  
  }

});