// Leitura e WhatsApp independem do vídeo. O arquivo só é solicitado após o clique.
export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const video = hero.querySelector('.hero__video');
  const watch = hero.querySelector('.hero__watch');
  const status = hero.querySelector('.hero__video-status');

  watch.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!video.getAttribute('src') || video.error) {
      video.src = watch.getAttribute('href');
      video.load();
    }
    video.hidden = false;
    watch.hidden = true;
    status.hidden = true;
    video.focus({ preventScroll: true });
    const playing = video.play();
    playing?.catch(() => {
      if (video.error) return;
      status.textContent = 'Toque no play do vídeo para assistir.';
      status.hidden = false;
    });
  });
  video.addEventListener('playing', () => { status.hidden = true; });
  video.addEventListener('error', () => {
    video.hidden = true;
    watch.hidden = false;
    status.textContent = 'Não foi possível carregar o vídeo. Toque na imagem para tentar de novo. Você também pode falar comigo pelo WhatsApp.';
    status.hidden = false;
    watch.focus({ preventScroll: true });
  });
  // Ao voltar à seção ou à aba, o visitante decide se quer continuar assistindo.
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) video.pause();
  }, { threshold: 0 }).observe(video);
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
}
