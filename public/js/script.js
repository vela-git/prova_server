document.addEventListener('DOMContentLoaded', () => {
  // SEZIONE LOADING e ANIMAZIONE DEL LOGO
  const logo = document.getElementById('logo');
  const loadingBg = document.getElementById('loading-bg');
  const loadingSection = document.getElementById('loading');

  // Controlla se l'animazione di loading è già stata eseguita
  if (sessionStorage.getItem('animationDone')) {
    loadingSection.style.display = 'none';
    logo.classList.add('final'); // Imposta lo stato finale senza transizione
  } else {
    logo.addEventListener('click', () => {
      logo.classList.add('transition');
      loadingBg.classList.add('bg-transition');

      logo.addEventListener('transitionend', () => {
        loadingSection.style.display = 'none';
        sessionStorage.setItem('animationDone', true);
      }, { once: true });
    });
  }

  // LISTENER PER I PULSANTI "bimba1" e "bimba2"
  const bimba1 = document.getElementById('bimba1');
  if (bimba1) {
    bimba1.addEventListener('click', () => {
      window.location.href = 'autori.html';
    });
  }

  const bimba2 = document.getElementById('bimba2');
  if (bimba2) {
    bimba2.addEventListener('click', () => {
      window.location.href = 'copyrights.html';
    });
  }

  // SEZIONE FOTOCAMERA
  const cameraIcon = document.getElementById('camera-icon');
  const camera = document.getElementById('camera');         // <video id="camera">
  const cardDisplay = document.getElementById('card-display'); // <img id="card-display">
  const logoContainer = document.getElementById('logo-container');
  const bottomSection = document.getElementById('bottom-section');
  const camera_container = document.getElementById('camera-container');
  const cameraIcon2 = document.getElementById('camera-icon-2');
  const loadingGif = document.getElementById('loading-gif');
  const retryBanner = document.getElementById('retry-banner');
  let stream = null;
  
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Il browser non supporta getUserMedia.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      camera.srcObject = stream;
      
      // Nascondi il logo (se necessario) durante la visione della camera
      if (logo) logo.style.opacity = '0'; 
      
      // Rendi visibile la sezione della fotocamera
      camera_container.style.display = 'block';
      camera.style.display = 'block';
      cameraIcon2.style.display = 'block';
      
      // Imposta lo stile del video
      camera.style.position = 'absolute';
      camera.style.top = '50%';
      camera.style.left = '50%';
      camera.style.transform = 'translate(-50%, -50%)';
      camera.style.aspectRatio = '9/16';
      camera.style.borderRadius = '8px';
      camera.style.width = '70%';
      camera.style.zIndex = '10';
    } catch (err) {
      console.error("Errore nell'accedere alla fotocamera:", err);
    }
  }
  
  async function captureAndSendFrame() {
    try {
      // Mostra la GIF di caricamento e nascondi il banner di riprova (se visibile)
      loadingGif.style.display = 'block';
      retryBanner.style.display = 'none';
      
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
      
      // Nascondi la GIF di caricamento
      loadingGif.style.display = 'none';
      
      if (result.cardName) {
        // In caso di risposta positiva, interrompi lo stream e reindirizza alla pagina illustrazioni
        camera.style.display = "none";
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        window.location.href = 'illustrazioni.html';
      } else {
        // Se la risposta non è corretta, lancia un errore per attivare il blocco catch
        throw new Error("Nessuna cardName nella risposta");
      }
    } catch (error) {
      console.error("Errore durante la POST:", error);
      // Nascondi la GIF di caricamento
      loadingGif.style.display = 'none';
      // Mostra il banner di riprova
      retryBanner.style.display = 'block';
      // Riavvia lo stream della fotocamera per permettere un nuovo scatto
      await startCamera();
    }
  }
  
  async function handleCameraIconClick() {
    // Nascondi gli elementi non relativi alla fotocamera
    if (logoContainer) logoContainer.style.display = 'none';
    if (bottomSection) bottomSection.style.display = 'none';
    if (cameraIcon) cameraIcon.style.display = 'none';
    if (cameraIcon2) cameraIcon2.style.display = 'none';
        
    // Se lo stream non è attivo, avvia la fotocamera; altrimenti, cattura e invia un frame
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

  if (cameraIcon2) {
    cameraIcon2.addEventListener('click', handleCameraIconClick);
    cameraIcon2.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleCameraIconClick();
    });
  }
});
