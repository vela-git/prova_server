document.addEventListener('DOMContentLoaded', () => {
    const backHomeBtn = document.getElementById('back-home');
  
    // Quando si clicca su "Torna alla Home"
    if (backHomeBtn) {
      backHomeBtn.addEventListener('click', () => {
        // Puoi usare window.location.href se vuoi tornare a index.html
        window.location.href = 'index.html';
        // Oppure, se preferisci tornare indietro nella cronologia del browser:
        // window.history.back();
      });
    }
  });
  