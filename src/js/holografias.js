// holografias.js

document.addEventListener('DOMContentLoaded', () => {
    const comparisonList = document.getElementById('comparison-list');
    const slider = document.getElementById('comparison-slider');
    const imageA = document.getElementById('image-a');
    const imageB = document.getElementById('image-b');
    const imageComparisonContainer = document.querySelector('.image-comparison-container');
    let isSliding = false;

    const cases = {
        1: { imageA: "/images/holografias/P1_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P1_Sin_Chaqueta_250_8000HZ.png" },
        2: { imageA: "/images/holografias/P2_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P2_Sin_Chaqueta_250_8000HZ.png" },
        3: { imageA: "/images/holografias/P7_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P7_Sin_Chaqueta_250_8000HZ.png" },
        4: { imageA: "/images/holografias/P4_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P4_Sin_Chaqueta_250_8000HZ.png" },
        5: { imageA: "/images/holografias/P6_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P6_Sin_Chaqueta_250_8000HZ.png" },
        6: { imageA: "/images/holografias/P8_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P8_Sin_Chaqueta_250_8000HZ.png" },
        7: { imageA: "/images/holografias/P29_Con_Chaqueta_250_8000HZ.png", imageB: "/images/holografias/P29_Sin_Chaqueta_250_8000HZ.png" },
    };

    comparisonList.addEventListener('click', (event) => {
        if (event.target.classList.contains('list-group-item')) {
            const caseId = event.target.getAttribute('data-case');

            // Cambiar imágenes
            imageA.src = cases[caseId].imageA;
            imageB.src = cases[caseId].imageB;

            // Actualizar estilo de la lista
            document.querySelectorAll('#comparison-list .list-group-item').forEach(item => {
                item.classList.remove('active-case');
            });
            event.target.classList.add('active-case');

            // Ajustar la altura del contenedor de comparación para mantener la proporción
            imageComparisonContainer.style.height = `${imageA.clientHeight}px`;
        }
    });

    slider.addEventListener('mousedown', () => {
        isSliding = true;
    });

    document.addEventListener('mouseup', () => {
        isSliding = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSliding) return;

        const containerRect = slider.parentNode.getBoundingClientRect();
        let x = e.clientX - containerRect.left;

        if (x < 0) x = 0;
        if (x > containerRect.width) x = containerRect.width;

        slider.style.left = `${x}px`;
        imageB.style.clip = `rect(0, ${x}px, auto, auto)`;
    });

    // Ajustar la altura del contenedor al cargar
    window.addEventListener('load', () => {
        imageComparisonContainer.style.height = `${imageA.clientHeight}px`;
    });

    // Ajustar la altura del contenedor al cambiar el tamaño de la ventana
    window.addEventListener('resize', () => {
        imageComparisonContainer.style.height = `${imageA.clientHeight}px`;
    });
});
