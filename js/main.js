var caja = document.getElementById('texto')
const texto = [
'Talento.',
'Trabajo en Equipo.',
'Resultados con Honestidad.'
]

var n=0;

let time = setInterval(contador,5000)

function contador(){
    if(n<texto.length){
        caja.innerHTML = texto[n]
        n=n+1;
    }else{
        n=0;
        caja.innerHTML = 'Defenza Juridica.'
    }
    
}
