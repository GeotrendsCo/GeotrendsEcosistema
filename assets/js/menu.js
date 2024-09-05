// Script para cambiar el fondo de cualquier botón del menú al hacer clic
document.querySelectorAll('.menu-card').forEach(button => {
    button.addEventListener('click', function () {
        // Elimina la clase 'active' de todos los botones
        document.querySelectorAll('.menu-card').forEach(btn => btn.classList.remove('active'));
        // Añade la clase 'active' al botón que fue clickeado
        this.classList.add('active');

        // Oculta todo el contenido en 'content'
        document.querySelectorAll('.content > div').forEach(div => div.style.display = 'none');

        const contentId = this.getAttribute('data-content');
        document.getElementById(contentId).style.display = 'block';
    });

    // Muestra el primer contenido por defecto
    document.querySelector('.menu-card').click();
});