document.addEventListener('DOMContentLoaded', () => {
    // Al click (o tocco) sull'intero body, avvia l'animazione
    document.body.addEventListener('click', () => {
      document.body.classList.add('animate');
      // Dopo la durata della transizione (1.5s), reindirizza alla homepage
      setTimeout(() => {
        window.location.href = "homepage.html";
      }, 1500);
    });
  });
  