document.addEventListener('DOMContentLoaded', () => {
  // SEZIONE LOADING e ANIMAZIONE DEL LOGO
  const logo = document.getElementById('logo');
  const loadingBg = document.getElementById('loading-bg');
  const loadingSection = document.getElementById('loading');

  if (sessionStorage.getItem('animationDone')) {
    loadingSection.style.display = 'none';
    logo.classList.add('final');
  } else {
    // Funzione per avviare l'animazione
    function startAnimation() {
      logo.classList.add('transition');
      loadingBg.classList.add('bg-transition');
      logo.addEventListener('transitionend', () => {
        loadingSection.style.display = 'none';
        sessionStorage.setItem('animationDone', true);
      }, { once: true });
    }
    
    // Ascolta i click su tutta la sezione loading
    loadingSection.addEventListener('click', startAnimation);
    
    // Ascolta i click anche direttamente sul logo
    logo.addEventListener('click', startAnimation);
    
    // Aggiungi anche gli eventi touchstart per dispositivi mobili
    loadingSection.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startAnimation();
    });
    
    logo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startAnimation();
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

  // SEZIONE FOTOCAMERA e MENU DI SELEZIONE CAMERA
  const cameraIcon = document.getElementById('camera-icon');
  const camera = document.getElementById('camera'); // <video id="camera">
  const cardDisplay = document.getElementById('card-display'); // <img id="card-display">
  const bottomSection = document.getElementById('bottom-section');
  const camera_container = document.getElementById('camera-container');
  const cameraIcon2 = document.getElementById('camera-icon-2');
  const loadingGif = document.getElementById('loading-gif');
  const retryBanner = document.getElementById('retry-banner');
  const cameraSelect = document.getElementById('camera-select');
  let stream = null;

  // Funzione per popolare il menu a tendina con le fotocamere disponibili
  async function populateCameraOptions() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      if (cameraSelect) {
        cameraSelect.innerHTML = '';
        videoDevices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          // Rinominato in maniera generica
          option.text = `Camera ${index + 1}`;
          cameraSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Errore nell'ottenere le camere:", err);
    }
  }

  // Avvia la fotocamera utilizzando il deviceId selezionato dal menu a tendina
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Il browser non supporta getUserMedia.");
      return;
    }
    try {
      // Se esiste già uno stream attivo, fermalo
      logo.style.display = 'none';
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const selectedDeviceId = cameraSelect ? cameraSelect.value : null;
      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { facingMode: "environment" },
        audio: false
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      camera.srcObject = stream;

      // Mostra il dropdown e la sezione fotocamera
      if (cameraSelect) cameraSelect.style.display = 'block';
      camera_container.style.display = 'block';
      camera.style.display = 'block';
      cameraIcon2.style.display = 'block';

      camera.style.position = 'absolute';
      camera.style.top = '50%';
      camera.style.left = '50%';
      camera.style.transform = 'translate(-50%, -50%)';
      camera.style.aspectRatio = '9/16';
      camera.style.width = '70%';
      camera.style.zIndex = '10';
    } catch (err) {
      console.error("Errore nell'accedere alla fotocamera:", err);
    }
  }

  async function captureAndSendFrame() {
    try {
      loadingGif.style.display = 'block';
      retryBanner.style.display = 'none';

      // Ottieni le dimensioni reali del frame dalla fotocamera
      const videoWidth = camera.videoWidth;
      const videoHeight = camera.videoHeight;
      const desiredAspect = 9 / 16; // Rapporto desiderato

      let cropX, cropY, cropWidth, cropHeight;

      // Se il frame è più orizzontale rispetto al rapporto 9:16, ritaglia centralmente
      if ((videoWidth / videoHeight) > desiredAspect) {
        cropHeight = videoHeight;
        cropWidth = videoHeight * desiredAspect;
        cropX = (videoWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Se il frame è più verticale, usa la larghezza e centra verticalmente
        cropWidth = videoWidth;
        cropHeight = videoWidth * (16 / 9);
        cropX = 0;
        cropY = (videoHeight - cropHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const context = canvas.getContext('2d');

      context.drawImage(camera, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const dataURL = canvas.toDataURL('image/jpeg');

      const response = await fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
      });

      const result = await response.json();
      console.log("Risposta dal server:", result);

      loadingGif.style.display = 'none';

      if (result.predicted_class_name) {
        const resultContainer = document.getElementById('result-container');
        if (resultContainer) {
          resultContainer.innerHTML = `
            <h1>Risultato Inferenza</h1>
            <p><strong>Classe:</strong> ${result.predicted_class}</p>
            <p><strong>Nome Carta:</strong> ${result.predicted_class_name}</p>
            <p><strong>Confidenza:</strong> ${(result.confidence * 100).toFixed(2)}%</p>
          `;
        } else {
          console.error("Elemento 'result-container' non trovato nel DOM.");
        }
        camera.style.display = "none";
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (cameraSelect) cameraSelect.style.display = 'none';
      } else {
        console.error("Il risultato non contiene 'predicted_class_name'.");
        throw new Error("Nessuna predicted_class_name nella risposta");
      }
    } catch (error) {
      console.error("Errore durante la POST:", error);
      loadingGif.style.display = 'none';
      retryBanner.style.display = 'block';
      await startCamera();
    }
  }

  async function handleCameraIconClick() {
    // Nascondi elementi non necessari
    if (bottomSection) bottomSection.style.display = 'none';
    if (cameraIcon) cameraIcon.style.display = 'none';
    if (cameraIcon2) cameraIcon2.style.display = 'none';

    if (!stream) {
      await startCamera();
    } else {
      console.log("Cattura e invia un frame");
      captureAndSendFrame();
    }
  }

  // Gestione del cambio di camera: se l'utente cambia la selezione, avvia il nuovo stream
  if (cameraSelect) {
    cameraSelect.addEventListener('change', async () => {
      console.log("Cambio camera: ", cameraSelect.value);
      await startCamera();
    });
  }

  // Popola il menu a tendina non appena possibile
  populateCameraOptions();

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
