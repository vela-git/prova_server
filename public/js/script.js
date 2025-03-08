document.addEventListener('DOMContentLoaded', () => {
  const logoLoading = document.getElementById('logo-loading');
  const loadingSection = document.getElementById('loading');
  
  // Al tocco/click sul logo della loading page
  logoLoading.addEventListener('click', () => {
    // Aggiungi la classe che innesca la transizione (rimpicciolimento e spostamento)
    logoLoading.classList.add('transition');
    
    // Quando la transizione finisce, nascondi la sezione di loading
    logoLoading.addEventListener('transitionend', () => {
      loadingSection.style.display = 'none';
    }, { once: true });
  });
});
