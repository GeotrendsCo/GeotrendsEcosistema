// JavaScript para manejar el video de introducción
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const introVideoContainer = document.getElementById('intro-video');
    const mainContent = document.getElementById('main-content');
    const branding = document.getElementById('branding');
    const sidebar = document.getElementById('sidebar');
    const pageContent = document.getElementById('page-content');
    const desiredDuration = 1; // Duración deseada en segundos

    video.play().catch(() => {
        // En caso de que la reproducción automática falle, se vuelve a intentar al hacer clic
        video.muted = true;
        video.play();
    });

    video.ontimeupdate = () => {
        if (video.currentTime >= desiredDuration - 3) {
            introVideoContainer.classList.add('fade-out');
        }

        if (video.currentTime >= desiredDuration) {
            video.pause();
            video.currentTime = 0;
            introVideoContainer.style.display = 'none';
            mainContent.style.display = 'block';
            branding.style.display = 'flex';
            openNav();
        }
    };

    video.onended = () => {
        introVideoContainer.style.display = 'none';
        mainContent.style.display = 'block';
        branding.style.display = 'flex';
        openNav();
    };

    function openNav() {
        sidebar.classList.add('open');
        pageContent.classList.add('shifted');
        branding.style.display = 'none';
    }
});
