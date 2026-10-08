const iconoFuego = document.getElementById('icono-fuego');
const aviso = document.getElementById('aviso');

let audioCtx = null;
let fuego = null;

function obtenerContexto() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function crearRuido(ctx, segundos) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * segundos), ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < datos.length; i++) {
    datos[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function iniciarFuego() {
  const ctx = obtenerContexto();
  if (ctx.state === 'suspended') ctx.resume();
  if (fuego) return;

  const salida = ctx.createGain();
  salida.gain.setValueAtTime(0, ctx.currentTime);
  salida.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.3);
  salida.connect(ctx.destination);

  const rugido = ctx.createBufferSource();
  rugido.buffer = crearRuido(ctx, 2);
  rugido.loop = true;
  const filtroRugido = ctx.createBiquadFilter();
  filtroRugido.type = 'lowpass';
  filtroRugido.frequency.value = 500;
  const volRugido = ctx.createGain();
  volRugido.gain.value = 0.5;
  rugido.connect(filtroRugido).connect(volRugido).connect(salida);
  rugido.start();

  const siseo = ctx.createBufferSource();
  siseo.buffer = crearRuido(ctx, 2);
  siseo.loop = true;
  const filtroSiseo = ctx.createBiquadFilter();
  filtroSiseo.type = 'bandpass';
  filtroSiseo.frequency.value = 3000;
  const volSiseo = ctx.createGain();
  volSiseo.gain.value = 0.06;
  siseo.connect(filtroSiseo).connect(volSiseo).connect(salida);
  siseo.start();

  const bufferChasquido = crearRuido(ctx, 0.03);
  const intervalo = setInterval(() => {
    const cantidad = Math.random() < 0.3 ? 3 : 1;
    for (let i = 0; i < cantidad; i++) {
      const t = ctx.currentTime + Math.random() * 0.08;
      const chasquido = ctx.createBufferSource();
      chasquido.buffer = bufferChasquido;
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'highpass';
      filtro.frequency.value = 1000 + Math.random() * 3000;
      const vol = ctx.createGain();
      vol.gain.setValueAtTime(0.3 + Math.random() * 0.7, t);
      vol.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      chasquido.connect(filtro).connect(vol).connect(salida);
      chasquido.start(t);
    }
  }, 90);

  fuego = { salida, fuentes: [rugido, siseo], intervalo };
}

function detenerFuego() {
  if (!fuego) return;
  const ctx = obtenerContexto();
  const { salida, fuentes, intervalo } = fuego;
  fuego = null;

  clearInterval(intervalo);
  salida.gain.cancelScheduledValues(ctx.currentTime);
  salida.gain.setValueAtTime(salida.gain.value, ctx.currentTime);
  salida.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  fuentes.forEach((f) => f.stop(ctx.currentTime + 0.45));
}

iconoFuego.addEventListener('mouseenter', () => {
  iconoFuego.classList.add('ardiendo');
  iniciarFuego();
});

iconoFuego.addEventListener('mouseleave', () => {
  iconoFuego.classList.remove('ardiendo');
  detenerFuego();
});

document.addEventListener('click', () => {
  obtenerContexto().resume();
  aviso.classList.add('oculto');
}, { once: true });
