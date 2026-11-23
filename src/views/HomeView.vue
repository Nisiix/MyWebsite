<template>
  <div class="home-page">
    <!-- ============ HERO ============ -->
    <section class="hero" id="hero-section" @pointermove="trackHero">
      <div class="hero-bg-grid"></div>
      <div class="hero-bg-grid hero-bg-grid-lit" aria-hidden="true"></div>
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>

      <div class="container hero-content">
        <div class="hero-badge fade-in">
          <i class="pi pi-code"></i>
          <span>Software Developer</span>
        </div>
        <h1 class="hero-title fade-in fade-in-delay-1">
          Ciao, sono<br>
          <span class="gold-gradient">Nisiix Dev</span>
        </h1>
        <p class="hero-subtitle fade-in fade-in-delay-2">
          Sviluppatore software specializzato in soluzioni gestionali,
          strumenti digitali e interfacce moderne che fanno la differenza.
        </p>
        <div class="hero-actions fade-in fade-in-delay-3">
          <router-link to="/progetti" class="btn-gold">
            <i class="pi pi-folder-open"></i>
            Esplora i Progetti
          </router-link>
          <router-link to="/curriculum" class="btn-outline">
            <i class="pi pi-file"></i>
            Il Mio Curriculum
          </router-link>
        </div>
      </div>
    </section>

    <!-- ============ SCROLL INDICATOR ============ -->
    <div class="scroll-indicator" @click="scrollToAbout">
      <span class="scroll-label">Scorri</span>
      <div class="scroll-chevrons">
        <i class="pi pi-chevron-down chevron chevron-1"></i>
        <i class="pi pi-chevron-down chevron chevron-2"></i>
      </div>
    </div>

    <!-- ============ ABOUT ME ============ -->
    <section class="section about-section" id="about-me">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" v-reveal>About Me</h2>
          <p class="section-subtitle" v-reveal="1">Chi sono e cosa mi appassiona nel mondo dello sviluppo software.</p>
        </div>

        <div class="about-grid">
          <div class="about-card glass-card" v-reveal="1">
            <div class="about-icon-wrapper">
              <i class="pi pi-user"></i>
            </div>
            <h3 class="about-card-title">Chi Sono</h3>
            <p class="about-card-text">
              Sono uno sviluppatore software e uno sportivo con una passione per la tecnologia che nasce
              fin dall'adolescenza, periodo nel quale mi interessavo principalmente all'uso del PC, all'esplorazione delle nuove tecnologie
              e ai videogiochi, per poi passare all'assemblaggio dei primi PC, e successivamente iniziare a scrivere
              le mie prime righe di codice. Nel corso della mia carriera oramai decennale, ho utilizzato principalmente
              e in modo approfondito <strong>Visual Basic 6</strong> e <strong>Microsoft Visual C#</strong>
              per lo sviluppo di applicazioni gestionali desktop e soluzioni enterprise.
              Successivamente ho ampliato le mie competenze implementando parti di progetti già avviati
              in <strong>Vue.js</strong> utilizzando JavaScript e in <strong>Netbeans</strong> utilizzando
              Java, contribuendo allo sviluppo di moduli web e backend.
            </p>
          </div>

          <div class="about-card glass-card" v-reveal="2">
            <div class="about-icon-wrapper">
              <i class="pi pi-compass"></i>
            </div>
            <h3 class="about-card-title">La Mia Filosofia</h3>
            <p class="about-card-text">
              Il mio approccio allo sviluppo è guidato dalla semplificazione del software, che deve
              risultare facile da capire, facile da modificare e facile da usare. Non sono un cultore
              di soluzioni software troppo complesse, prediligo una soluzione semplice, con poche funzionalità ma 
              che faccia ciò che deve fare. 
            </p>
            <p class="about-card-text">
              Credo che l'<strong>Intelligenza Artificiale</strong> sia uno strumento straordinariamente
              utile che può accelerare e potenziare il lavoro dello sviluppatore. L'AI aiuta ad esplorare
              soluzioni, automatizzare compiti ripetitivi e velocizza i primi passi di creazione di un software. Tuttavia, è
              fondamentale avere una <strong>solida conoscenza pregressa</strong> dello sviluppo software:
              senza comprendere i principi architetturali, i pattern di design e la logica di business,
              l'AI rimane uno strumento senza direzione che rischia di creare più danni che benefici.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ ACTIVITIES ============ -->
    <section class="section activities-section" id="activities">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" v-reveal>Activities</h2>
          <p class="section-subtitle" v-reveal="1">Le attività che occupano le mie giornate nel mondo tech.</p>
        </div>

        <div class="activities-grid">
          <div class="activity-item glass-card" v-for="(activity, index) in activities" :key="index" v-reveal="index">
            <div class="activity-number">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="activity-content">
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-text">{{ activity.description }}</p>
            </div>
            <div class="activity-icon">
              <i :class="activity.icon"></i>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ HOBBIES ============ -->
    <section class="section hobbies-section" id="hobbies">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" v-reveal>Hobbies</h2>
          <p class="section-subtitle" v-reveal="1">Quando non scrivo codice, ecco cosa mi tiene impegnato.</p>
        </div>

        <div class="hobbies-grid">
          <div class="hobby-card glass-card" v-for="(hobby, index) in hobbies" :key="index" v-reveal="index">
            <div class="hobby-emoji">{{ hobby.emoji }}</div>
            <h3 class="hobby-title">{{ hobby.title }}</h3>
            <p class="hobby-text">{{ hobby.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ CONTATTI ============ -->
    <section class="section contacts-section" id="contatti">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" v-reveal>Contatti</h2>
          <p class="section-subtitle" v-reveal="1">Hai un progetto in mente o vuoi solo fare due chiacchiere? Scrivimi.</p>
        </div>

        <div class="contact-card glass-card" v-reveal="2">
          <div class="contact-email">
            <div class="about-icon-wrapper">
              <i class="pi pi-envelope"></i>
            </div>
            <a :href="'mailto:' + contatti.email" class="contact-email-link">{{ contatti.email }}</a>
            <button
              type="button"
              class="btn-copy"
              :class="{ copied }"
              @click="copyEmail"
              :aria-label="copied ? 'Email copiata' : 'Copia email'"
            >
              <i :class="copied ? 'pi pi-check' : 'pi pi-copy'"></i>
              <span>{{ copied ? 'Copiata' : 'Copia' }}</span>
            </button>
          </div>

          <div class="contact-socials">
            <a
              v-for="social in visibleSocials"
              :key="social.name"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
            >
              <i :class="social.icon"></i>
              <span>{{ social.name }}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useContattiStore } from '@/stores/contatti'

const contatti = useContattiStore()
const visibleSocials = computed(() => contatti.socials.filter((s) => s.url))

const copied = ref(false)
let copiedTimer
async function copyEmail() {
  try {
    await navigator.clipboard.writeText(contatti.email)
  } catch {
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
}

// Lights up the background grid around the pointer
const trackHero = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--hx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--hy', `${e.clientY - r.top}px`)
}

const scrollToAbout = () => {
  const el = document.getElementById('about-me')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const activities = ref([
  {
    title: 'Sviluppo Software Gestionale',
    description: 'Progetto e sviluppo applicazioni gestionali personalizzate per aziende, dalla fase di analisi dei requisiti alla messa in produzione. Ogni soluzione è costruita su misura per ottimizzare i flussi di lavoro del cliente, integrando moduli di fatturazione, gestione magazzino e reportistica avanzata.',
    icon: 'pi pi-briefcase'
  },
  {
    title: 'Creazione di Tool & Template',
    description: 'Realizzo strumenti di utilità e template riutilizzabili per accelerare lo sviluppo su piattaforme gestionali. Dai generatori di codice ai sistemi di scaffolding, ogni tool nasce dall\'esigenza concreta di ridurre i tempi di sviluppo e mantenere la coerenza tra progetti diversi.',
    icon: 'pi pi-wrench'
  },
  {
    title: 'UI/UX Design & Prototipazione',
    description: 'Progetto interfacce utente intuitive e moderne utilizzando Figma per la prototipazione (traendo occasionalmente spunto da strumenti di AI generativa) e Vue.js con framework UI come Vuetify per l\'implementazione. Credo che un\'interfaccia ben progettata sia fondamentale per l\'adozione e la soddisfazione dell\'utente finale.',
    icon: 'pi pi-palette'
  },
  {
    title: 'Migrazione & Modernizzazione',
    description: 'Supporto le aziende nella migrazione di applicazioni legacy — spesso scritte in VB6 o tecnologie datate — verso architetture moderne basate su .NET e Vue.js, preservando la logica di business consolidata e migliorando performance e manutenibilità.',
    icon: 'pi pi-sync'
  }
])

const hobbies = ref([
  {
    emoji: '🎮',
    title: 'Gaming',
    description: 'I videogiochi sono sempre stati la mia valvola di sfogo. Dai classici RPG single-player ai frenetici sparatutto, il gaming mi ha aiutato a migliorare il problem-solving e il pensiero laterale. Tra i titoli che mi hanno più segnato ci sono Call of Duty, GTA V, The Witcher 3, Red Dead Redemption 2 e molti altri.'
  },
  {
    emoji: '🎵',
    title: 'Music',
    description: 'La musica è la colonna sonora della mia vita. Ascolto moltissimi generi musicali — dal rock all\'elettronica, dall\'hip-hop al jazz, passando per la house e la techno. Quando posso, mi svago utilizzando la console da DJ: mixare tracce e creare mi aiuta a staccare la spina.'
  },
  {
    emoji: '⚽',
    title: 'Sports',
    description: 'Lo sport è parte fondamentale della mia vita. Gioco regolarmente a calcio e padel, due passioni che mi accompagnano da sempre. Ma sono tendenzialmente portato per lo sport in generale e mi piace praticare anche pallavolo, ping pong e sci. '
  }
])
</script>

<style scoped>
/* ============ HERO ============ */
.hero {
  position: relative;
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 50px 0 60px;
}

.hero-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%);
}

.hero-bg-grid-lit {
  background-image:
    linear-gradient(rgba(212, 175, 55, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 175, 55, 0.22) 1px, transparent 1px);
  mask-image: radial-gradient(260px circle at var(--hx, 50%) var(--hy, 45%), black, transparent 70%);
  -webkit-mask-image: radial-gradient(260px circle at var(--hx, 50%) var(--hy, 45%), black, transparent 70%);
  opacity: 0;
  transition: opacity 0.6s var(--ease-smooth);
  pointer-events: none;
}

.hero:hover .hero-bg-grid-lit {
  opacity: 1;
}

@media (hover: none) {
  .hero-bg-grid-lit {
    opacity: 0.45;
  }
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
}

.hero-orb-1 {
  width: 400px;
  height: 400px;
  background: var(--gold);
  top: 10%;
  right: -5%;
  opacity: 0.08;
  animation: float 8s ease-in-out infinite;
}

.hero-orb-2 {
  width: 300px;
  height: 300px;
  background: var(--gold-dark);
  bottom: 10%;
  left: -5%;
  opacity: 0.06;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: var(--gold-subtle);
  border: 1px solid var(--border-gold);
  border-radius: 100px;
  color: var(--gold);
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 28px;
  letter-spacing: 0.5px;
}

.hero-badge i {
  font-size: 0.8rem;
}

.hero-title .gold-gradient {
  background-size: 200% auto;
  animation: goldSweep 6s ease-in-out infinite;
}

@keyframes goldSweep {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 7vw, 5rem);
  font-weight: 900;
  line-height: 1.1;
  color: var(--text-white);
  margin-bottom: 24px;
  letter-spacing: -1px;
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: var(--text-secondary);
  max-width: 620px;
  margin: 0 auto 40px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* ============ SCROLL INDICATOR ============ */
.scroll-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0 32px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.3s;
}

.scroll-indicator:hover {
  opacity: 0.7;
}

.scroll-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.scroll-chevrons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  line-height: 0;
}

.chevron {
  font-size: 0.95rem;
  color: var(--gold);
  animation: bounce-chevron 2s ease-in-out infinite;
}

.chevron-2 {
  opacity: 0.4;
  animation-delay: 0.15s;
}

@keyframes bounce-chevron {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(6px); opacity: 1; }
}

/* ============ ABOUT ME ============ */
.section-header {
  margin-bottom: 48px;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr));
  gap: 24px;
}

.about-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-subtle);
  border: 1px solid var(--border-gold);
  border-radius: 14px;
  color: var(--gold);
  font-size: 1.3rem;
  transition: all 0.3s var(--ease-smooth);
}

.about-card:hover .about-icon-wrapper {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--bg-primary);
  transform: rotate(-5deg) scale(1.05);
}

.about-card-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-white);
}

.about-card-text {
  color: var(--text-secondary);
  font-size: 0.96rem;
  line-height: 1.8;
}

/* ============ ACTIVITIES ============ */
.activities-section {
  background: var(--bg-secondary);
}

.activities-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
}

.activity-number {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--gold);
  opacity: 0.25;
  min-width: 60px;
  text-align: center;
  transition: opacity 0.3s;
}

.activity-item:hover .activity-number {
  opacity: 0.6;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 8px;
}

.activity-text {
  color: var(--text-secondary);
  font-size: 0.93rem;
  line-height: 1.7;
}

.activity-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-subtle);
  border-radius: 12px;
  color: var(--gold);
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: all 0.3s var(--ease-smooth);
}

.activity-item:hover .activity-icon {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--bg-primary);
}

/* ============ HOBBIES ============ */
.hobbies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 20px;
}

.hobby-card {
  text-align: center;
  padding: 36px 28px;
}

.hobby-emoji {
  font-size: 3rem;
  margin-bottom: 16px;
  display: inline-block;
  transition: transform 0.4s var(--ease-bounce);
}

.hobby-card:hover .hobby-emoji {
  transform: scale(1.2) rotate(-5deg);
}

.hobby-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 12px;
}

.hobby-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
}

/* ============ CONTATTI ============ */
.contacts-section {
  background: var(--bg-secondary);
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.contact-email {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.contact-card:hover .about-icon-wrapper {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--bg-primary);
  transform: rotate(-5deg) scale(1.05);
}

.contact-email-link {
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 3.5vw, 2rem);
  font-weight: 700;
  color: var(--text-white);
  overflow-wrap: anywhere;
  background: linear-gradient(var(--gold), var(--gold)) left bottom / 0 2px no-repeat;
  transition: color 0.3s var(--ease-smooth), background-size 0.4s var(--ease-smooth);
}

.contact-email-link:hover {
  color: var(--gold);
  background-size: 100% 2px;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--border-medium);
  border-radius: 100px;
  transition: all 0.3s var(--ease-smooth);
}

.btn-copy:hover {
  color: var(--gold);
  border-color: var(--border-gold);
  background: var(--gold-subtle);
}

.btn-copy.copied {
  color: var(--bg-primary);
  background: var(--gold);
  border-color: var(--gold);
}

.btn-copy.copied i {
  animation: copyPop 0.4s var(--ease-bounce);
}

@keyframes copyPop {
  from { transform: scale(0.4); }
  to { transform: scale(1); }
}

.contact-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
}

.social-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: var(--text-secondary);
  font-size: 0.92rem;
  font-weight: 500;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: all 0.3s var(--ease-smooth);
}

.social-link i {
  color: var(--gold);
  font-size: 1.05rem;
  transition: transform 0.3s var(--ease-bounce);
}

.social-link:hover {
  color: var(--text-white);
  border-color: var(--border-gold);
  transform: translateY(-2px);
}

.social-link:hover i {
  transform: scale(1.15) rotate(-6deg);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  .hero {
    padding: 60px 0 40px;
  }

  .activity-item {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .activity-number {
    font-size: 1.8rem;
  }

  .btn-copy {
    margin-left: 0;
  }

  .social-link {
    flex: 1 1 calc(50% - 6px);
    justify-content: center;
  }
}
</style>
