/* ─── Touch burst effect ─── */
function spawnBurst(x, y) {
  const icons = ['🦋','💗','✨','🌸','💖'];
  const el = document.createElement('div');
  el.className = 'burst';
  el.textContent = icons[Math.floor(Math.random() * icons.length)];
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
document.addEventListener('click', e => spawnBurst(e.clientX, e.clientY));
document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  spawnBurst(t.clientX, t.clientY);
}, { passive: true });

/* ─── Prevenir scroll al inicio (Overlay activo) ─── */
document.body.style.overflow = 'hidden';
const welcomeOverlay = document.getElementById('welcomeOverlay');
if (welcomeOverlay) {
  welcomeOverlay.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
}

/* ─── LÓGICA PASO 1: BOTONES JUGUETONES ─── */
const btnSi = document.getElementById('btnSi');
const btnNo = document.getElementById('btnNo');
const btnContainer = document.getElementById('btnContainer');

let intentosFai = 0;
const intentosMaximos = 5; 

function moverBotonSi() {
  intentosFai++;

  if (btnSi.parentNode !== document.body) {
    const rect = btnSi.getBoundingClientRect();
    btnSi.style.width = rect.width + 'px';
    btnSi.style.height = rect.height + 'px';
    document.body.appendChild(btnSi);
  }

  btnSi.style.position = 'fixed';
  btnSi.style.zIndex = '100002';
  btnSi.style.margin = '0';
  btnSi.style.transform = 'none';

  const anchoPantalla = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const altoPantalla = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  const anchoBoton = btnSi.offsetWidth || 100;
  const altoBoton = btnSi.offsetHeight || 50;
  const margen = 25;

  const limiteMaximoX = Math.max(0, anchoPantalla - anchoBoton - (margen * 2));
  const limiteMaximoY = Math.max(0, altoPantalla - altoBoton - (margen * 2));

  const coordenadaX = margen + Math.floor(Math.random() * limiteMaximoX);
  const coordenadaY = margen + Math.floor(Math.random() * limiteMaximoY);

  btnSi.style.left = coordenadaX + 'px';
  btnSi.style.top = coordenadaY + 'px';

  let nuevaOpacidad = 1 - (intentosFai / intentosMaximos);
  if (nuevaOpacidad < 0) nuevaOpacidad = 0;
  
  btnNo.style.opacity = nuevaOpacidad;
  if (nuevaOpacidad === 0) {
    btnNo.style.pointerEvents = 'none';
  }
}

btnSi.addEventListener('mouseover', () => {
  if (intentosFai < intentosMaximos) {
    moverBotonSi();
  }
});

btnSi.addEventListener('touchstart', (e) => {
  if (intentosFai < intentosMaximos) {
    e.preventDefault(); 
    e.stopPropagation();
    moverBotonSi();
  }
}, { passive: false });

// UNIFICADO: Un solo evento para cuando da clic final en SÍ
btnSi.addEventListener('click', () => {
  document.getElementById('phasePregunta').style.display = 'none';
  btnSi.style.display = 'none'; 
  document.getElementById('phasePastel').style.display = 'block';
  
  console.log("¡Dio clic en SÍ! Pasamos al pastel.");
  activarMicrofono(); 
});

btnNo.addEventListener('click', () => {
  alert("¡Esa opción ya no está disponible! 😜");
});


/* ─── LÓGICA PASO 2: DETECCIÓN DEL SOPLIDO (MICRÓFONO) ─── */
let audioContext = null;
let analyser = null;
let microphone = null;
let javascriptNode = null;
let miStream = null; // Guardar el stream globalmente para cerrarlo limpio

function activarMicrofono() {
  const micStatus = document.getElementById('micStatus');
  const cakeOn = document.getElementById('cakeOn');

  // Habilitar de inmediato la opción de tocar el pastel como alternativa de respaldo segura
  cakeOn.style.cursor = 'pointer';
  cakeOn.onclick = apagarVelasMágicas;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(function(stream) {
      miStream = stream;
      micStatus.textContent = "¡Micrófono listo! Sopla fuerte en el micrófono de tu cel...💨 (O toca el pastel si no carga)";
      
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = function() {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) { values += array[i]; }

        const volumenPromedio = values / length;

        // Umbral del soplido
        if (volumenPromedio > 35) {
          apagarVelasMágicas();
        }
      };
    })
    .catch(function(err) {
      console.warn("Acceso al micrófono no disponible o denegado:", err);
      micStatus.innerHTML = "Sopla fuerte... 💨<br><span style='font-size:0.9rem; opacity:0.7;'>(Si tu navegador bloquea el micrófono por seguridad, ¡puedes **darle un toque al pastel** para apagar las velas!)</span>";
    });
  } else {
    micStatus.innerHTML = "¡Dale un **toque al pastel** para soplar las velitas! 🎂";
  }
}

function apagarVelasMágicas() {
  // Desactivar procesos del micrófono si estaban corriendo
  if (javascriptNode) javascriptNode.onaudioprocess = null;
  if (miStream) {
    miStream.getTracks().forEach(track => track.stop());
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
  }

  const cakeOn = document.getElementById('cakeOn');
  const cakeOff = document.getElementById('cakeOff');
  const cakeInstruction = document.getElementById('cakeInstruction');
  const micStatus = document.getElementById('micStatus');
  const welcomeOverlay = document.getElementById('welcomeOverlay');

  if (cakeOn) cakeOn.style.display = 'none';
  if (cakeOff) cakeOff.style.display = 'block';
  
  if (cakeInstruction) cakeInstruction.textContent = "¡Pide un deseo! ✨💖";
  if (micStatus) micStatus.textContent = "¡Lo lograste!";

  // Transición suave para desaparecer el Overlay y liberar el scroll de la página completa
  setTimeout(() => {
    if (welcomeOverlay) {
      welcomeOverlay.style.opacity = "0";
      welcomeOverlay.style.transform = "scale(1.05)";
      
      setTimeout(() => {
        welcomeOverlay.remove();
        // Habilitamos el scroll para que pueda ver toda tu hermosa página
        document.body.style.overflow = '';
        
        // 🎶 ¡AQUÍ ENTRA LA MÚSICA DE FORMA PERFECTA!
        reproducirMusicaPastel();

        // ✨ REVELAR EL BOTÓN FLOTANTE DE AUDIO
        configurarBotonAudio();
      }, 1500);
    }
  }, 2000); 
}










/* ─── Música de fondo con activación por interacción ─── */
const audio = document.getElementById('bgMusic');

if (audio) {
  // Ajusta el volumen aquí: 0.0 es silencio total y 1.0 es el máximo.
  // 0.15 o 0.20 es perfecto para que suene despacito de fondo.
  audio.volume = 0.15; 
  }

  // Función exclusiva para encender la música en el momento correcto
function reproducirMusicaPastel() {
  if (audio) {
    audio.play().then(() => {
      console.log("🎶 Música iniciada con éxito en la escena del pastel.");
    }).catch(error => {
      console.log("El navegador bloqueó el audio automático:", error);
    });
  }
}

/* ─── Photo Lightbox ─── */
const lightbox   = document.getElementById('lightbox');
const lbImg      = document.getElementById('lbImg');
const lbCaption  = document.getElementById('lbCaption');
const lbClose    = document.getElementById('lbClose');

document.querySelectorAll('.photo-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (!img || img.style.display === 'none') return; // sin foto cargada, no abrir
    lbImg.src = img.src;
    lbCaption.textContent = item.dataset.caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lbImg.src = '';
}
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });



/* ─── Starfield ─── */
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
function initStars() {
  stars = [];
  const count = window.innerWidth < 500 ? 100 : 200;
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.2+0.2, speed: Math.random()*0.008+0.002, phase: Math.random()*Math.PI*2 });
  }
}
function drawStars(ts) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    const a = 0.3 + 0.5*Math.sin(ts*s.speed+s.phase);
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,200,230,${a})`; ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
resizeCanvas(); initStars(); requestAnimationFrame(drawStars);
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });

/* ─── SVG butterfly maker ─── */
function makeButterflyPath(c1, c2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
    <g class="wing-l">
      <ellipse cx="30" cy="32" rx="28" ry="22" fill="${c1}" opacity="0.85"/>
      <ellipse cx="22" cy="52" rx="18" ry="13" fill="${c2}" opacity="0.7"/>
    </g>
    <g class="wing-r" style="transform-origin:60px 40px;transform:scaleX(-1) translateX(-120px)">
      <ellipse cx="30" cy="32" rx="28" ry="22" fill="${c1}" opacity="0.85"/>
      <ellipse cx="22" cy="52" rx="18" ry="13" fill="${c2}" opacity="0.7"/>
    </g>
    <ellipse cx="60" cy="40" rx="5" ry="20" fill="#1a0010"/>
    <ellipse cx="60" cy="22" rx="3" ry="3" fill="#1a0010"/>
  </svg>`;
}

/* ─── BG butterflies ─── */
const bflyColors = [
  ['#ff4d9e','#c2185b'],['#ff80bc','#ff4d9e'],['#ffd6ec','#ff4d9e'],
  ['#e91e8c','#880e4f'],['#ff6ec7','#ff1493'],
];
const bgEl = document.getElementById('bflyBg');
const bgCount = window.innerWidth < 500 ? 7 : 14;
for (let i = 0; i < bgCount; i++) {
  const [c1,c2] = bflyColors[i % bflyColors.length];
  const div = document.createElement('div');
  div.className = 'bg-butterfly';
  div.innerHTML = makeButterflyPath(c1, c2);
  div.querySelector('svg').style.width = (40 + Math.random()*70) + 'px';
  div.querySelector('svg').style.height = 'auto';
  div.style.left = (Math.random()*90) + '%';
  div.style.top  = (Math.random()*90) + '%';
  div.style.setProperty('--op', (0.08 + Math.random()*0.15).toFixed(2));
  div.style.setProperty('--d',  (4 + Math.random()*6) + 's');
  div.style.setProperty('--tx', (-20 + Math.random()*40) + 'px');
  div.style.setProperty('--ty', (-30 + Math.random()*20) + 'px');
  div.style.setProperty('--r0', (-8 + Math.random()*16) + 'deg');
  div.style.setProperty('--r1', (-8 + Math.random()*16) + 'deg');
  div.style.animationDelay = (Math.random()*2) + 's';
  bgEl.appendChild(div);
}

/* ─── Falling petals ─── */
const petalsEl = document.getElementById('petals');
const symbols = ['🦋','🌸','💗','✨','🌺'];
const petalCount = window.innerWidth < 500 ? 10 : 18;
for (let i = 0; i < petalCount; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  p.textContent = symbols[Math.floor(Math.random()*symbols.length)];
  p.style.left = (Math.random()*100) + 'vw';
  p.style.fontSize = (0.7 + Math.random()*0.8) + 'rem';
  p.style.animationDuration = (9 + Math.random()*12) + 's';
  p.style.animationDelay    = (Math.random()*10) + 's';
  petalsEl.appendChild(p);
}

/* ─── Interactive Wishes ─── */
const wishes = [
  { icon: '🦋', label: 'Mariposas',  msg: '¡Que tu vida esté llena de mariposas tan hermosas como tú, Moshi! Cada aleteo es un abrazo de Angel hacia ti.' },
  { icon: '💗', label: 'Amor',       msg: 'Mi amor por ti es tan grande como el cielo nocturno y tan brillante como cada estrella. ¡Siempre juntos, Moshi!' },
  { icon: '🎂', label: 'Felicidad',  msg: '¡Que este nuevo año de vida te traiga una felicidad que desbordes en sonrisas! Te mereces todo lo bueno del mundo.' },
  { icon: '✨', label: 'Sueños',     msg: '¡Que todos tus sueños se hagan realidad este año! Aquí estaré yo, Angel, para apoyarte en cada uno de ellos.' },
  { icon: '🌺', label: 'Salud',      msg: '¡Que tengas mucha salud y energía para vivir cada día al máximo! Tu bienestar es lo más importante para mí.' },
  { icon: '🌙', label: 'Paz',        msg: 'Que encuentres paz y tranquilidad en cada rincón de tu vida, como la quietud de una noche estrellada. Te amo, Moshi.' },
];

const wishGrid = document.getElementById('wishGrid');
const wishBubble = document.getElementById('wishBubble');
let activeWish = null;

wishes.forEach((w, i) => {
  const btn = document.createElement('button');
  btn.className = 'wish-btn';
  btn.innerHTML = `<span class="wish-icon">${w.icon}</span>${w.label}`;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wish-btn').forEach(b => b.classList.remove('picked'));
    btn.classList.add('picked');
    wishBubble.classList.remove('show');
    setTimeout(() => {
      wishBubble.textContent = w.msg;
      wishBubble.classList.add('show');
    }, 100);
  });
  wishGrid.appendChild(btn);
});



/* ─── Gallery ─── */
const galleryData = [
  {label:'Rosa Encanto',  c1:'#ff80bc', c2:'#ff4d9e'},
  {label:'Noche Oscura',  c1:'#c2185b', c2:'#880e4f'},
  {label:'Pétalo Suave',  c1:'#ffd6ec', c2:'#ff80bc'},
  {label:'Amor Profundo', c1:'#ff4d9e', c2:'#c2185b'},
  {label:'Magia Rosa',    c1:'#ff6ec7', c2:'#ff1493'},
];
const bRow = document.getElementById('bRow');
galleryData.forEach(({label, c1, c2}) => {
  const item = document.createElement('div');
  item.className = 'b-item';
  item.innerHTML = `<div class="b-svg">${makeButterflyPath(c1,c2)}</div><span class="b-label">${label}</span>`;
  bRow.appendChild(item);
});

/* ─── Countdown ─── */
function updateCountdown() {
  const now    = new Date();
  const target = new Date(2026, 4, 21, 0, 0, 0); // May 21, 2026
  const diff   = target - now;
  if (diff <= 0) {
    document.getElementById('countdown').style.display = 'none';
    document.getElementById('cd-msg').style.display = 'block';
    return;
  }
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5)  / 6e4);
  const s = Math.floor((diff % 6e4)   / 1000);
  document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ─── Intersection Observer ─── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ─── LOGICA DEL BOTÓN FLOTANTE MUTE ─── */
function configurarBotonAudio() {
  const audioBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const miAudio = document.getElementById('bgMusic');

  if (!audioBtn || !miAudio) return;

  // Mostramos el botón con una animación o cambio de display
  audioBtn.style.display = 'flex';

  // Sincronizar el icono inicial por si las dudas
  audioIcon.textContent = miAudio.paused ? '🔇' : '🔊';

  audioBtn.addEventListener('click', (e) => {
    // Evita activar efectos raros de fondo al cliquear el botón
    e.stopPropagation(); 

    if (miAudio.paused) {
      // Si estaba pausado, lo reproducimos
      miAudio.play().then(() => {
        audioIcon.textContent = '🔊';
        audioBtn.classList.remove('muted');
      }).catch(err => console.log("Error al reanudar audio:", err));
    } else {
      // Si estaba sonando, lo pausamos
      miAudio.pause();
      audioIcon.textContent = '🔇';
      audioBtn.classList.add('muted');
    }
  });
}