<template>
  <div ref="homeRoot" class="home-page">
    <!-- ============ HERO ============ -->
    <section class="hero" id="hero-section">

      <div class="container hero-content">
        <div class="hero-chip fade-in">
          <SnapChip />
        </div>
        <!-- Il titolo resta per screen reader e motori di ricerca; a schermo la parola
             NISIIX è composta dai blocchi 3D dello sfondo, in questo spazio vuoto -->
        <h1 class="hero-title">
          <span class="sr-only">{{ $t('home.hello') }} Nisiix Dev</span>
          <span class="hero-word" data-bg-word="NISIIX" aria-hidden="true"></span>
        </h1>
        <p class="hero-subtitle fade-in fade-in-delay-2">{{ $t('home.subtitle') }}</p>
      </div>
    </section>

    <!-- ============ SCROLL INDICATOR ============ -->
    <button type="button" class="scroll-indicator" @click="scrollToAbout" :aria-label="$t('home.scrollLabel')">
      <span class="scroll-label">{{ $t('home.scroll') }}</span>
      <span class="scroll-chevrons" aria-hidden="true">
        <i class="pi pi-chevron-down chevron chevron-1"></i>
        <i class="pi pi-chevron-down chevron chevron-2"></i>
      </span>
    </button>

    <!-- ============ ABOUT ME ============ -->
    <section class="section about-section" id="about-me">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" v-spin-title="$t('home.aboutTitle')"></h2>
          <p class="section-subtitle" v-reveal="1">{{ $t('home.aboutSubtitle') }}</p>
        </div>

        <div class="about-grid">
          <div class="about-card glass-card" v-reveal="1">
            <div class="about-icon-wrapper">
              <i class="pi pi-user"></i>
            </div>
            <h3 class="about-card-title">{{ $t('home.journeyTitle') }}</h3>
            <p class="about-card-text" v-html="$t('home.journeyText1')"></p>
            <p class="about-card-text" v-html="$t('home.journeyText2')"></p>
            <ul class="about-stack" :aria-label="$t('home.stackLabel')">
              <li v-for="tech in stack" :key="tech" class="about-stack-item">{{ tech }}</li>
            </ul>
          </div>

          <div class="about-card glass-card" v-reveal="2">
            <div class="about-icon-wrapper">
              <i class="pi pi-compass"></i>
            </div>
            <h3 class="about-card-title">{{ $t('home.philosophyTitle') }}</h3>
            <p class="about-card-text" v-html="$t('home.philosophyText1')"></p>
            <p class="about-card-text" v-html="$t('home.philosophyText2')"></p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ ACTIVITIES ============ -->
    <section class="section activities-section" id="activities">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" v-spin-title="$t('home.activitiesTitle')"></h2>
          <p class="section-subtitle" v-reveal="1">{{ $t('home.activitiesSubtitle') }}</p>
        </div>

        <div class="activities-grid">
          <div class="activity-item glass-card" v-for="(activity, index) in activities" :key="index" v-reveal="index">
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
          <h2 class="section-title" v-spin-title="$t('home.hobbiesTitle')"></h2>
          <p class="section-subtitle" v-reveal="1">{{ $t('home.hobbiesSubtitle') }}</p>
        </div>

        <div class="hobbies-grid">
          <div class="hobby-card glass-card" v-for="(hobby, index) in hobbies" :key="index" v-reveal="index">
            <div class="about-icon-wrapper hobby-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path v-for="(d, i) in hobby.icon" :key="i" :d="d" />
              </svg>
            </div>
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
          <h2 class="section-title" v-spin-title="$t('home.contactsTitle')"></h2>
          <p class="section-subtitle" v-reveal="1">{{ $t('home.contactsSubtitle') }}</p>
        </div>

        <div class="contact-card glass-card" v-reveal="2">
          <div v-if="contatti.email" class="contact-email">
            <div class="about-icon-wrapper">
              <i class="pi pi-envelope"></i>
            </div>
            <a :href="'mailto:' + contatti.email" class="contact-email-link">{{ contatti.email }}</a>
            <button
              type="button"
              class="btn-outline btn-sm btn-copy"
              :class="{ copied }"
              @click="copyEmail"
              :aria-label="copied ? $t('home.copiedLabel') : $t('home.copyLabel')"
              :title="copied ? $t('home.copiedLabel') : $t('home.copyLabel')"
            >
              <i :class="copied ? 'pi pi-check' : 'pi pi-copy'" aria-hidden="true"></i>
            </button>
          </div>

          <div v-if="visibleSocials.length" class="contact-socials">
            <a
              v-for="social in visibleSocials"
              :key="social.name"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-outline btn-sm social-link"
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
import { t } from '@/i18n'
import SnapChip from '@/components/SnapChip.vue'
import { useLetterFall } from '@/composables/useLetterFall'

const contatti = useContattiStore()

// "Schiocca le dita": metà delle lettere dei testi cade, "Sacrifica Iron Man" le riporta su
const homeRoot = ref(null)
useLetterFall(homeRoot)
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

const scrollToAbout = () => {
  const el = document.getElementById('about-me')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const activityIcons = ['pi pi-briefcase', 'pi pi-wrench', 'pi pi-sync']
const activities = computed(() =>
  t('home.activities').map((item, i) => ({ ...item, icon: activityIcons[i] }))
)

// Icone a linea disegnate nello stesso stile di PrimeIcons (che non ha controller né pallone)
const hobbyIcons = [
  // controller
  ['M7 8h10a4 4 0 0 1 4 4v3.5a2.5 2.5 0 0 1-4.6 1.4L15 15H9l-1.4 1.9A2.5 2.5 0 0 1 3 15.5V12a4 4 0 0 1 4-4z', 'M7.5 11v3', 'M6 12.5h3', 'M15.5 11.5h.01', 'M17.5 13.5h.01'],
  // cuffie
  ['M4 15v-3a8 8 0 0 1 16 0v3', 'M4 15a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2z', 'M20 15a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2z'],
  // pallone
  ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4z', 'M12 7.5V3.2', 'M15.8 10.3l4.1-1.4', 'M14.3 14.7l2.6 3.6', 'M9.7 14.7l-2.6 3.6', 'M8.2 10.3L4.1 8.9']
]
const hobbies = computed(() =>
  t('home.hobbies').map((item, i) => ({ ...item, icon: hobbyIcons[i] }))
)

// Tecnologie principali del percorso, in evidenza sotto il testo
const stack = ['Visual Basic 6', 'C#', '.NET', 'JavaScript', 'Vue.js', 'Java']
</script>

<style scoped>
/* ============ HERO ============ */
.hero {
  position: relative;
  min-height: 75vh;
  min-height: 75svh;
  display: flex;
  /* in alto e non centrato: la scritta a blocchi si aggancia alla griglia dello sfondo,
     così resta sempre alla stessa distanza dalla chip */
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  padding: 50px 0 24px;
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero .hero-chip {
  margin-bottom: 28px;
}

.hero-title {
  margin-bottom: 8px;
}

/* Spazio riservato alla scritta fatta di blocchi: 5 righe di lettere + margine sopra e sotto,
   la cella della griglia vale clamp(18px, 5vw, 60px) come nello sfondo.
   L'altezza resta di 8 celle perché lo sfondo centra la scritta in questo spazio; il margine
   negativo riavvicina il sottotitolo, che altrimenti resterebbe staccato di quasi 3 righe vuote. */
.hero-word {
  display: block;
  height: calc(8 * var(--cell));
  margin-bottom: calc(-1.5 * var(--cell));
}



.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 620px;
  margin: 0 auto 8px;
  line-height: 1.8;
}

/* ============ SCROLL INDICATOR ============ */
.scroll-indicator {
  display: flex;
  margin: 0 auto;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: var(--tap);
  padding: 16px 24px 32px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.3s;
}

.scroll-indicator:hover {
  opacity: 0.7;
}

.scroll-label {
  font-size: var(--text-xs);
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
}

/* Tecnologie del percorso */
.about-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.about-stack-item {
  padding: 4px 12px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--gold);
  background: var(--gold-subtle);
  border: 1px solid var(--border-gold);
  border-radius: 100px;
}

.about-card-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-white);
}

.about-card-text {
  max-width: var(--measure);
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: 1.8;
}

/* ============ ACTIVITIES ============ */
.activities-section {
  background: var(--section-tint);
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
  padding: var(--space-card);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 8px;
}

.activity-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
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
}


/* ============ HOBBIES ============ */
.hobbies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 20px;
}

.hobby-card {
  text-align: center;
  padding: var(--space-card);
}

.hobby-icon {
  margin: 0 auto 16px;
}

.hobby-icon svg {
  width: 26px;
  height: 26px;
}

.hobby-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 12px;
}

.hobby-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: 1.7;
}

/* ============ CONTATTI ============ */
.contacts-section {
  background: var(--section-tint);
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.contact-email {
  display: flex;
  align-items: center;
  gap: 12px 20px;
  flex-wrap: wrap;
}


.contact-email-link {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
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
  width: var(--tap);
  height: var(--tap);
  padding: 0;
  justify-content: center;
  flex-shrink: 0;
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
}

.contact-email + .contact-socials {
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
}

.social-link i {
  transition: transform 0.3s var(--ease-bounce);
}

.social-link:hover i {
  transform: scale(1.15) rotate(-6deg);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  /* su telefono l'altezza minima lasciava mezzo schermo vuoto sopra "Scorri" */
  .hero {
    min-height: 0;
    padding: 60px 0 16px;
  }

  .activity-item {
    flex-direction: column;
    text-align: center;
  }

  .social-link {
    flex: 1 1 calc(50% - 6px);
    justify-content: center;
  }
}
</style>
