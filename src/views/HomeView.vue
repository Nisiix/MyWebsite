<template>
  <div class="home-page">
    <!-- ============ HERO ============ -->
    <section class="hero" id="hero-section">

      <div class="container hero-content">
        <div class="hero-badge fade-in">
          <i class="pi pi-code"></i>
          <span>{{ $t('home.badge') }}</span>
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
          <h2 class="section-title" v-reveal>{{ $t('home.aboutTitle') }}</h2>
          <p class="section-subtitle" v-reveal="1">{{ $t('home.aboutSubtitle') }}</p>
        </div>

        <div class="about-grid">
          <div class="about-card glass-card" v-reveal="1">
            <div class="about-icon-wrapper">
              <i class="pi pi-user"></i>
            </div>
            <h3 class="about-card-title">{{ $t('home.journeyTitle') }}</h3>
            <p class="about-card-text" v-html="$t('home.journeyText')"></p>
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
          <h2 class="section-title" v-reveal>{{ $t('home.activitiesTitle') }}</h2>
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
          <h2 class="section-title" v-reveal>{{ $t('home.hobbiesTitle') }}</h2>
          <p class="section-subtitle" v-reveal="1">{{ $t('home.hobbiesSubtitle') }}</p>
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
          <h2 class="section-title" v-reveal>{{ $t('home.contactsTitle') }}</h2>
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

const scrollToAbout = () => {
  const el = document.getElementById('about-me')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const activityIcons = ['pi pi-briefcase', 'pi pi-wrench', 'pi pi-sync']
const activities = computed(() =>
  t('home.activities').map((item, i) => ({ ...item, icon: activityIcons[i] }))
)

const hobbyEmojis = ['🎮', '🎵', '⚽']
const hobbies = computed(() =>
  t('home.hobbies').map((item, i) => ({ ...item, emoji: hobbyEmojis[i] }))
)
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

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero .hero-badge {
  margin-bottom: 28px;
}

.hero-title {
  margin-bottom: 8px;
}

/* Spazio riservato alla scritta fatta di blocchi: 5 righe di lettere + margine sopra e sotto,
   la cella della griglia vale clamp(18px, 5vw, 60px) come nello sfondo */
.hero-word {
  display: block;
  height: calc(8 * clamp(18px, 5vw, 60px));
}



.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: var(--text-secondary);
  max-width: 620px;
  margin: 0 auto 40px;
  line-height: 1.8;
}

/* ============ SCROLL INDICATOR ============ */
.scroll-indicator {
  display: flex;
  margin: 0 auto;
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
  padding: 28px 32px;
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
  width: 36px;
  height: 36px;
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
  .hero {
    padding: 60px 0 40px;
  }

  .activity-item {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .social-link {
    flex: 1 1 calc(50% - 6px);
    justify-content: center;
  }
}
</style>
