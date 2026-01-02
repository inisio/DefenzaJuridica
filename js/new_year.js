// Clase configurable para fuegos artificiales
class FireworksSystem {
  constructor(config = {}) {
    this.config = {
      svgElement: config.svgElement || document.getElementById('fireworks'),
      maxActiveFireworks: config.maxActiveFireworks || 10,
      launchInterval: config.launchInterval || 1200,
      particlesPerFirework: config.particlesPerFirework || 60,
      gravity: config.gravity || 0.02,
      colors: config.colors || ["#ff4500", "#ff0000", "#ffaa00", "#ff6600", "#ffd700"],
      rocketSpeed: config.rocketSpeed || { min: 8, max: 10 },
      particleSpeed: config.particleSpeed || { min: 1, max: 5 },
      particleLife: config.particleLife || 140,
      ...config
    };
    
    this.svg = this.config.svgElement;
    this.particles = [];
    this.rockets = [];
    this.fireworkCount = 0;
    this.animationId = null;
    this.launchIntervalId = null;
    this.fireworksQueue = []; // Cola para fuegos en espera
    this.maxQueueSize = 5; // Máximo fuegos en cola de espera
    
    this.init();
  }
  
  init() {
    this.resizeSVG();
    window.addEventListener('resize', () => this.resizeSVG());
    this.animate();
    this.startAutoLaunch();
    
    this.svg.addEventListener('click', (e) => {
      this.requestFirework(e.clientX);
    });
  }
  
  resizeSVG() {
    this.svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  }
  
  // Solicita un fuego artificial (se encola si hay límite)
  requestFirework(x) {
    const totalActive = this.rockets.length + (this.particles.length > 0 ? 1 : 0);
    
    if (totalActive >= this.config.maxActiveFireworks) {
      // Si ya hay máximo, se encola si hay espacio
      if (this.fireworksQueue.length < this.maxQueueSize) {
        this.fireworksQueue.push({ x, time: Date.now() });
        console.log(`Fuego en cola. Cola: ${this.fireworksQueue.length}`);
      }
      return;
    }
    
    this.launchRocket(x);
  }
  
  launchRocket(x) {
    const y = window.innerHeight;
    const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    head.setAttribute("r", 3);
    head.setAttribute("fill", "white");
    this.svg.appendChild(head);
    
    const rocketId = Date.now() + Math.random();
    this.rockets.push({
      id: rocketId,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -this.config.rocketSpeed.min - Math.random() * (this.config.rocketSpeed.max - this.config.rocketSpeed.min),
      targetY: window.innerHeight * (0.2 + Math.random() * 0.3),
      head,
      exploded: false
    });
    
    console.log(`Cohete lanzado. Cohetes activos: ${this.rockets.length}`);
  }
  
  createFirework(x, y, rocketId) {
    // Verificar si ya tenemos demasiadas partículas activas
    const totalElements = this.rockets.length + this.particles.length;
    if (totalElements >= this.config.maxActiveFireworks * 10) {
      console.log("Demasiadas partículas activas, omitiendo explosión");
      return;
    }
    
    const explosionId = Date.now() + Math.random();
    let particlesCreated = 0;
    const maxParticles = Math.min(
      this.config.particlesPerFirework,
      (this.config.maxActiveFireworks * 10) - totalElements
    );
    
    for (let i = 0; i < maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (this.config.particleSpeed.max - this.config.particleSpeed.min) + this.config.particleSpeed.min;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", Math.random() * 3 + 2);
      c.setAttribute("fill", this.config.colors[Math.floor(Math.random() * this.config.colors.length)]);
      c.setAttribute("filter", "url(#fireGlow)");
      this.svg.appendChild(c);
      
      this.particles.push({
        explosionId,
        rocketId,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: this.config.particleLife,
        maxLife: this.config.particleLife,
        el: c,
        flicker: Math.random() * 10
      });
      particlesCreated++;
    }
    
    console.log(`Explosión creada: ${particlesCreated} partículas. Total partículas: ${this.particles.length}`);
  }
  
  animate() {
    // Actualizar cohetes
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.03;
      r.head.setAttribute("cx", r.x);
      r.head.setAttribute("cy", r.y);
      
      if (r.y <= r.targetY && !r.exploded) {
        this.createFirework(r.x, r.y, r.id);
        this.svg.removeChild(r.head);
        r.exploded = true;
        this.rockets.splice(i, 1);
        
        // Intentar lanzar fuegos en cola
        this.processQueue();
      }
    }
    
    // Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += this.config.gravity;
      p.life--;
      p.flicker += 5;
      
      p.el.setAttribute("cx", p.x);
      p.el.setAttribute("cy", p.y);
      p.el.setAttribute("opacity", (p.life / p.maxLife) * Math.abs(Math.sin(p.flicker)));
      
      if (p.life <= 0) {
        this.svg.removeChild(p.el);
        this.particles.splice(i, 1);
        
        // Si esta partícula era la última de su explosión, procesar cola
        const remainingParticlesFromExplosion = this.particles.filter(
          particle => particle.explosionId === p.explosionId
        ).length;
        
        if (remainingParticlesFromExplosion === 0) {
          this.processQueue();
        }
      }
    }
    
    // Limpieza periódica de cola antigua
    if (Date.now() % 5000 < 16) { // Cada ~5 segundos
      this.fireworksQueue = this.fireworksQueue.filter(
        firework => Date.now() - firework.time < 10000 // Eliminar solicitudes de más de 10 segundos
      );
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  processQueue() {
    const totalActive = this.rockets.length + (this.particles.length > 0 ? 1 : 0);
    
    if (totalActive < this.config.maxActiveFireworks && this.fireworksQueue.length > 0) {
      const nextFirework = this.fireworksQueue.shift();
      this.launchRocket(nextFirework.x);
      console.log(`Procesando cola. Quedan: ${this.fireworksQueue.length}`);
    }
  }
  
  startAutoLaunch() {
    this.launchIntervalId = setInterval(() => {
      this.requestFirework(Math.random() * window.innerWidth);
    }, this.config.launchInterval);
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.launchIntervalId) {
      clearInterval(this.launchIntervalId);
    }
  }
  
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  getStats() {
    return {
      rockets: this.rockets.length,
      particles: this.particles.length,
      queue: this.fireworksQueue.length,
      totalActive: this.rockets.length + (this.particles.length > 0 ? 1 : 0)
    };
  }
}

// Clase para animación de texto
class TextAnimation {
  constructor(config = {}) {
    this.config = {
      elementId: config.elementId || '#fireworks_titulo',
      fontUrl: config.fontUrl || 'https://cdn.jsdelivr.net/gh/akzhy/Vara@master/fonts/Satisfy/SatisfySL.json',
      text: config.text || 'Happy New Year',
      fontSize: config.fontSize || 54,
      strokeWidth: config.strokeWidth || 2.6,
      color: config.color || '#1a1a1a',
      duration: config.duration || 4200,
      ...config
    };
    
    this.init();
  }
  
  init() {
    new Vara(
      this.config.elementId,
      this.config.fontUrl,
      [{
        text: this.config.text,
        fontSize: this.config.fontSize,
        strokeWidth: this.config.strokeWidth,
        color: this.config.color,
        duration: this.config.duration,
        textAlign: 'center'
      }],
      { autoAnimation: true }
    );
  }
}

const IS_ANDROID = navigator.userAgent.toLowerCase().includes("android");

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {

  // Configuración de la animación de texto
  const textAnimation = new TextAnimation({
    text: 'Happy New Year',
    fontSize: 24,
    strokeWidth: 2.6,
    color: '#ffffffff',
    duration: 4200
  });

  if (IS_ANDROID) {
    const svg = document.getElementById("fireworks");
    if (svg) {
      svg.style.pointerEvents = "none";
      svg.style.display = "none";
    }
    return;
  }

  // Configuración del sistema de fuegos artificiales
  const fireworks = new FireworksSystem({
    maxActiveFireworks: 10,       // Máximo 10 fuegos activos en total
    launchInterval: 1500,         // Cada 1.2 segundos
    particlesPerFirework: 20,     // Partículas por explosión
    gravity: 0.002,
    colors: ["#ff4500", "#ff0000", "#ffaa00", "#ff6600", "#ffd700"]
    //colors: ["#998a69ff", "#e0d6a8ff", "#ffaa00", "#ff6600", "#ffd700"]
  });
  
  // Mostrar estadísticas cada 5 segundos
  setInterval(() => {
    const stats = fireworks.getStats();
    console.log(`Estadísticas: Cohetes: ${stats.rockets}, Partículas: ${stats.particles}, Cola: ${stats.queue}, Total Activos: ${stats.totalActive}`);
  }, 5000);
});
