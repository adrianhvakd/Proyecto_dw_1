const lienzo = document.getElementById("pajaroVolador");
const ctx = lienzo.getContext("2d");

const gravedad = 0.8; 
const pajaro = { x: 50, y: 150, ancho: 20, alto: 20, velocidad: 0 };
const tubos = [];
const anchoTubo = 40;
const espacio = 100;
let cuadro = 0;
let puntaje = 0;
let juegoTerminado = false;
const imagenp = new Image();
imagenp.src = "./img/pajaro.png";
const imagenTuboArriba = new Image();
const imagenTuboAbajo = new Image();
imagenTuboArriba.src = "./img/tuboa.png";
imagenTuboAbajo.src = "./img/tuboab.png";

document.addEventListener("keydown", () => {
    if (!juegoTerminado) pajaro.velocidad = -8;
});

function dibujarPajaro() {
    
    ctx.drawImage(imagenp, pajaro.x, pajaro.y, pajaro.ancho, pajaro.alto);
}

function dibujarTubos() {
    tubos.forEach((tubo) => {
    ctx.drawImage(imagenTuboArriba, tubo.x, 0, anchoTubo, tubo.superior);
    ctx.drawImage(imagenTuboAbajo, tubo.x, lienzo.height - tubo.inferior, anchoTubo, tubo.inferior);
    });
}

function actualizarTubos() {
    if (cuadro % 90 === 0) {
    const superior = Math.random() * (lienzo.height - espacio - 50) + 20;
    const inferior = lienzo.height - superior - espacio;
    tubos.push({ x: lienzo.width, superior, inferior });
    }
    tubos.forEach((tubo, indice) => {
    tubo.x -= 2;
    if (
        pajaro.x < tubo.x + anchoTubo &&
        pajaro.x + pajaro.ancho > tubo.x &&
        (pajaro.y < tubo.superior || pajaro.y + pajaro.alto > lienzo.height - tubo.inferior)
    ) {
        juegoTerminado = true;
    }
    if (tubo.x + anchoTubo < 0) {
        tubos.splice(indice, 1);
        puntaje++;
    }
    });
}

function dibujarPuntaje() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Puntaje: ${puntaje}`, 10, 20);
}


function cicloJuego() {
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);

    if (!juegoTerminado) {
    pajaro.velocidad += gravedad;
    pajaro.y += pajaro.velocidad;

    if (pajaro.y + pajaro.alto > lienzo.height || pajaro.y < 0) {
        juegoTerminado = true;
    }

    dibujarPajaro();
    actualizarTubos();
    dibujarTubos();
    dibujarPuntaje();
    cuadro++;
    requestAnimationFrame(cicloJuego);
    } else {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("Game over", lienzo.width / 5, lienzo.height / 2);
    }
}

cicloJuego();