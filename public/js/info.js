document.addEventListener('DOMContentLoaded', () => {
    const backToCard = document.getElementById('back-to-card');
    if (backToCard) {
      backToCard.addEventListener('click', () => {
        // Torna alla pagina precedente nella cronologia
        window.history.back();
        // Oppure reindirizza a una pagina specifica, ad esempio:
        // window.location.href = 'card.html';
      });
    }
  });
  