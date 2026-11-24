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

              <div class="skill-bar-track">
                <div
                  class="skill-bar-fill"
                  :style="{ '--level': skill.level + '%' }"
                ></div>
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
            <span class="tech-badge" v-for="tech in techStack" :key="tech">{{ tech }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCurriculumStore } from '@/stores/curriculum'

const store = useCurriculumStore()

const techStack = ref([
  'Visual Basic 6', 'C#', '.NET', 'WinForms',
  'JavaScript', 'Vue.js', 'Vuetify', 'Pinia', 'PrimeVue',
  'Express.js', 'Node.js', 'REST API', 'Java', 'Netbeans',
  'Microsoft Access', 'NHibernate', 'Figma', 'Git', 'HTML5', 'CSS3'
])
</script>

<style scoped>
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

.skill-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 14px;
}

.skill-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light));
  border-radius: 3px;
  width: 0;
  transition: width 1.4s var(--ease-smooth) calc(var(--reveal-delay, 0ms) + 250ms);
  position: relative;
}

/* Bars fill up when their card scrolls into view */
.is-revealed .skill-bar-fill {
  width: var(--level);
}

.skill-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 6px;
  background: var(--gold-light);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--gold-glow);
  animation: pulseGlow 2s infinite;
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
