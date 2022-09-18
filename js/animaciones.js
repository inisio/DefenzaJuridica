let ubicacion = window.pageYOffset;
window.onscroll = function(){
    let ubicacion_actual = window.pageYOffset;
    if(ubicacion >= ubicacion_actual){
        document.getElementById('menu').style.top='0';
    }else{
        document.getElementById('menu').style.top='-100%';
    }
    ubicacion = ubicacion_actual;
}

const cuadro1 = document.getElementById('imagen_1');
const cuadro2 = document.getElementById('imagen_2');
const cuadro3 = document.getElementById('imagen_3');

const cargar_cuadro = (entradas, observador) => {
    entradas.forEach(entrada => {
        if(entrada.isIntersecting){
            entrada.target.classList.add('active');
        }
        
    });
}

const observador = new IntersectionObserver(cargar_cuadro, {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
});

observador.observe(cuadro1);
observador.observe(cuadro2);
observador.observe(cuadro3);
