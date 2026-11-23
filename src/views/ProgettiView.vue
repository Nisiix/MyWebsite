<template>
  <div class="progetti-page">
    <!-- Header -->
    <section class="progetti-hero">
      <div class="container">
        <div class="progetti-hero-content fade-in">
          <div class="hero-badge">
            <i class="pi pi-folder-open"></i>
            <span>Portfolio</span>
          </div>
          <h1 class="page-title">
            I Miei <span class="gold-gradient">Progetti</span>
          </h1>
          <p class="page-subtitle">
            Una selezione dei progetti a cui ho lavorato, dalle piattaforme gestionali
            ai tools di sviluppo. Ogni progetto racconta una storia di sfide e soluzioni.
          </p>
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="section projects-section">
      <div class="container">
        <div class="projects-grid">
          <component
            :is="project.url ? 'a' : 'div'"
            v-for="(project, index) in store.projects"
            :key="index"
            class="project-card glass-card"
            :class="{ 'is-link': project.url }"
            v-bind="project.url ? { href: project.url, target: '_blank', rel: 'noopener noreferrer' } : {}"
            v-reveal="index"
          >
            <!-- Preview Image Area -->
            <div class="project-preview" :style="{ '--accent': project.color }">
              <div class="preview-pattern"></div>
              <div class="preview-icon">
                <i :class="project.icon || 'pi pi-desktop'"></i>
              </div>

            </div>

            <!-- Card Content -->
            <div class="project-content">
              <h3 class="project-name">{{ project.name }}</h3>
              <p class="project-description">{{ project.description }}</p>

              <!-- Tags -->
              <div class="project-tags">
                <span
                  v-for="tag in project.tags"
                  :key="tag"
                  class="project-tag"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- Explore Button -->
              <span
                v-if="project.url"
                class="btn-explore"
                :style="{ '--accent': project.color }"
              >
                <span>Visita il sito</span>
                <i class="pi pi-external-link"></i>
              </span>
              <button v-else class="btn-explore" :style="{ '--accent': project.color }">
                <span>Esplora</span>
                <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          </component>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useProgettiStore } from '@/stores/progetti'

const store = useProgettiStore()
</script>

<style scoped>
/* Hero */
.progetti-hero {
  padding: 120px 0 60px;
  text-align: center;
  position: relative;
  background:
    radial-gradient(ellipse 50% 50% at 50% 100%, rgba(212, 175, 55, 0.04), transparent);
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
  margin-bottom: 24px;
  letter-spacing: 0.5px;
}

.page-title {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: var(--text-white);
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.8;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr));
  gap: 28px;
}

/* Project Card */
.project-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-6px);
}

/* Preview */
.project-preview {
  position: relative;
  height: 220px;
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, var(--accent, var(--gold)), transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03), transparent 40%);
  opacity: 0.15;
  transition: opacity 0.5s;
}

.project-card:hover .preview-pattern {
  opacity: 0.3;
}

.preview-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  color: var(--accent, var(--gold));
  font-size: 2rem;
  transition: all 0.4s var(--ease-smooth);
  z-index: 1;
}

.project-card:hover .preview-icon {
  transform: scale(1.1) rotate(-3deg);
  background: var(--accent, var(--gold));
  color: var(--bg-primary);
  border-color: transparent;
}

.preview-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 5px 14px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  z-index: 1;
}

/* Content */
.project-content {
  padding: 28px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.project-name {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 12px;
}

.project-description {
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.7;
  margin-bottom: 20px;
  flex: 1;
}

/* Tags */
.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.project-tag {
  padding: 5px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 100px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  transition: all 0.3s;
}

.project-card:hover .project-tag {
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

/* Explore Button */
.btn-explore {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: transparent;
  color: var(--accent, var(--gold));
  font-weight: 600;
  font-size: 0.92rem;
  border: 1px solid color-mix(in srgb, var(--accent, var(--gold)) 35%, transparent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
  align-self: flex-start;
  font-family: var(--font-body);
}

.btn-explore i {
  font-size: 0.85rem;
  transition: transform 0.3s var(--ease-smooth);
}

.project-card.is-link {
  cursor: pointer;
}

.btn-explore:hover,
.project-card.is-link:hover .btn-explore {
  background: color-mix(in srgb, var(--accent, var(--gold)) 10%, transparent);
  border-color: var(--accent, var(--gold));
  transform: translateX(4px);
}

.btn-explore:hover i,
.project-card.is-link:hover .btn-explore i {
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .project-preview {
    height: 180px;
  }
}
</style>
