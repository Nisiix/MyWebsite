<template>
  <div class="curriculum-page">
    <!-- Header -->
    <section class="page-hero">
      <div class="container">
        <div class="curriculum-hero-content fade-in">
          <div class="hero-badge">
            <i class="pi pi-file"></i>
            <span>{{ $t('curriculum.badge') }}</span>
          </div>
          <h1 class="page-title">
            {{ $t('curriculum.titleStart') }} <span class="gold-gradient">{{ $t('curriculum.titleAccent') }}</span>
          </h1>
          <p class="page-subtitle">{{ $t('curriculum.subtitle') }}</p>
          <div class="cv-download">
            <a :href="cvCurrent" class="btn-gold" download>
              <i class="pi pi-download" aria-hidden="true"></i>
              <span>{{ $t('curriculum.download') }}</span>
            </a>
            <a :href="cvOther" class="btn-outline" :hreflang="$t('curriculum.downloadOtherLang')" download>
              <i class="pi pi-file-pdf" aria-hidden="true"></i>
              <span>{{ $t('curriculum.downloadOther') }}</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills Sections -->
    <section class="section skills-section">
      <div class="container">
        <div
          v-for="(category, catIndex) in store.skills"
          :key="catIndex"
          class="skill-category"
        >
          <div class="category-header" v-reveal>
            <div class="category-icon-wrapper">
              <i :class="category.icon"></i>
            </div>
            <h2 class="category-title">{{ $tr(category.category) }}</h2>
          </div>

          <div class="skills-list">
            <div
              v-for="(skill, skillIndex) in category.items"
              :key="skillIndex"
              class="skill-card glass-card"
              v-reveal="skillIndex"
            >
              <div class="skill-top">
                <h3 class="skill-name">{{ skill.name }}</h3>
              </div>

              <p class="skill-description">{{ $tr(skill.description) }}</p>
            </div>
          </div>
        </div>

        <!-- Specialization -->
        <div class="specialization glass-card" v-reveal>
          <div class="spec-icon">
            <i class="pi pi-star-fill"></i>
          </div>
          <div class="spec-content">
            <h3 class="spec-title">{{ $t('curriculum.specTitle') }}</h3>
            <p class="spec-text" v-html="$t('curriculum.specText')"></p>
          </div>
        </div>

        <!-- Tech stack badges -->
        <div class="tech-stack" v-reveal>
          <h3 class="tech-stack-title">{{ $t('curriculum.stackTitle') }}</h3>
          <div class="tech-badges">
            <span class="tech-badge" v-for="tech in store.techStack" :key="tech">{{ tech }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCurriculumStore } from '@/stores/curriculum'
import { t, locale } from '@/i18n'

const store = useCurriculumStore()

// CV in PDF generati durante il deploy da scripts/build-cv.mjs (cartella cv/ del sito)
const cvUrl = (lang) => `${import.meta.env.BASE_URL}cv/NisiixDev-CV-${lang}.pdf`
const cvCurrent = computed(() => cvUrl(locale.value))
const cvOther = computed(() => cvUrl(t('curriculum.downloadOtherLang')))
</script>

<style scoped>
.cv-download {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

/* Hero */
/* Skill Categories */
.skill-category {
  margin-bottom: 60px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.category-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-subtle);
  border: 1px solid var(--border-gold);
  border-radius: 12px;
  color: var(--gold);
  font-size: 1.2rem;
}

.category-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-white);
}

.skills-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 500px), 1fr));
  gap: 16px;
}

/* Skill Card */
.skill-card {
  padding: 24px 28px;
}

.skill-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.skill-name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-white);
}

.skill-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
}

/* Specialization */
.specialization {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 60px;
  border-color: var(--border-gold);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.03), var(--bg-card));
}

.spec-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border-radius: 14px;
  color: var(--bg-primary);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.spec-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 12px;
}

.spec-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.8;
}

/* Tech Stack Badges */
.tech-stack {
  text-align: center;
}

.tech-stack-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 24px;
}

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.tech-badge {
  padding: 8px 18px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 100px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s var(--ease-smooth);
}

.tech-badge:hover {
  border-color: var(--border-gold);
  color: var(--gold);
  background: var(--gold-subtle);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .specialization {
    flex-direction: column;
  }
}
</style>
