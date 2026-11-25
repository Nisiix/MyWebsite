<template>
  <div ref="pageRoot" class="progetti-page">
    <!-- Header -->
    <section class="page-hero">
      <div class="container">
        <div class="progetti-hero-content fade-in">
          <div class="hero-badge">
            <i class="pi pi-folder-open"></i>
            <span>{{ $t('projects.badge') }}</span>
          </div>
          <h1 class="page-title">
            {{ $t('projects.titleStart') }} <span class="gold-gradient">{{ $t('projects.titleAccent') }}</span>
          </h1>
          <p class="page-subtitle">{{ $t('projects.subtitle') }}</p>
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
            :key="project.name"
            class="project-card glass-card"
            :class="{ 'is-link': project.url }"
            v-bind="project.url ? { href: project.url, target: '_blank', rel: 'noopener noreferrer' } : {}"
            v-reveal="index"
          >
            <!-- Preview Image Area -->
            <div class="project-preview" :style="{ '--accent': project.color }">
              <img
                v-if="project.image"
                class="preview-image"
                :src="project.image"
                :alt="$t('projects.previewAlt').replace('{name}', project.name)"
                loading="lazy"
                decoding="async"
                width="1280"
                height="720"
              />
              <div v-else class="preview-pattern"></div>

            </div>

            <!-- Card Content -->
            <div class="project-content">
              <h3 class="project-name">{{ project.name }}</h3>
              <p class="project-description">{{ $tr(project.description) }}</p>

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
                <span>{{ $t('projects.visit') }}</span>
                <span class="sr-only">{{ $t('a11y.newTab') }}</span>
                <i class="pi pi-external-link" aria-hidden="true"></i>
              </span>
            </div>
          </component>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useProgettiStore } from '@/stores/progetti'
import { useLetterFall } from '@/composables/useLetterFall'

const store = useProgettiStore()

// "Schiocca le dita": metà delle lettere cade anche qui (vedi useLetterFall)
const pageRoot = ref(null)
useLetterFall(pageRoot)
</script>

<style scoped>
/* Hero */
/* Projects Grid */
.projects-grid {
  position: relative;
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

.project-preview:has(.preview-image) {
  height: auto;
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid var(--border-subtle);
}

.preview-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  transition: transform 0.6s var(--ease-smooth), filter 0.4s;
  filter: saturate(0.9) brightness(0.92);
}

.project-preview:has(.preview-image)::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45), transparent 45%);
  pointer-events: none;
}

.project-card:hover .preview-image {
  transform: scale(1.04);
  filter: saturate(1) brightness(1);
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

.preview-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 5px 14px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 100px;
  font-size: var(--text-xs);
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
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 12px;
}

.project-description {
  color: var(--text-secondary);
  font-size: var(--text-base);
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
  font-size: var(--text-xs);
  font-weight: 500;
  transition: 0.3s;
  transition-property: var(--transition-props);
}

.project-card:hover .project-tag {
  border-color: var(--border-medium);
  color: var(--text-secondary);
}

/* Explore Button */
.btn-explore {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: transparent;
  color: var(--accent, var(--gold));
  font-weight: 600;
  font-size: var(--text-md);
  letter-spacing: 0.3px;
  border: 1px solid color-mix(in srgb, var(--accent, var(--gold)) 35%, transparent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: 0.3s var(--ease-smooth);
  transition-property: var(--transition-props);
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
