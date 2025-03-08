document.addEventListener('DOMContentLoaded', () => {
  // Usa requestAnimationFrame per assicurarti che il browser abbia renderizzato gli stili iniziali
  requestAnimationFrame(() => {
    document.getElementById('page2').classList.add('visible');
  });
});
  