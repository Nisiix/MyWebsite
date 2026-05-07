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
          <div
            v-for="(project, index) in store.projects"
            :key="index"
            class="project-card glass-card"
          >
            <!-- Preview Image Area -->
            <div class="project-preview" :style="{ '--accent': project.color }">
              <div class="preview-pattern"></div>
              <div class="preview-icon">
                <i class="pi pi-desktop"></i>
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
              <button class="btn-explore" :style="{ '--accent': project.color }">
                <span>Esplora</span>
                <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div class="contact-section">
          <div class="contact-card glass-card">
            <div class="cta-glow"></div>
            <h3 class="cta-title">Vuoi collaborare?</h3>
            <p class="cta-text">
              Sono sempre aperto a nuove sfide e collaborazioni interessanti.
              Se hai un progetto in mente, parliamone.
            </p>

            <form class="contact-form" @submit.prevent="handleSubmit" id="contact-form">
              <!-- Title -->
              <div class="form-group">
                <label class="form-label" for="contact-title">
                  <i class="pi pi-pencil"></i>
                  Titolo del Progetto
                </label>
                <input
                  type="text"
                  id="contact-title"
                  v-model="contactForm.title"
                  class="form-input"
                  placeholder="Es: Nuovo gestionale per PMI"
                  required
                />
              </div>

              <!-- Multi-select Technologies -->
              <div class="form-group">
                <label class="form-label">
                  <i class="pi pi-code"></i>
                  Tecnologie da Utilizzare
                </label>
                <div class="tech-select-grid">
                  <label
                    v-for="tech in curriculumStore.technologies"
                    :key="tech"
                    :class="['tech-chip', { selected: contactForm.technologies.includes(tech) }]"
                  >
                    <input
                      type="checkbox"
                      :value="tech"
                      v-model="contactForm.technologies"
                      class="tech-checkbox"
                    />
                    <span class="tech-chip-label">{{ tech }}</span>
                  </label>
                </div>
              </div>

              <!-- Description -->
              <div class="form-group">
                <label class="form-label" for="contact-description">
                  <i class="pi pi-align-left"></i>
                  Descrizione del Progetto
                </label>
                <textarea
                  id="contact-description"
                  v-model="contactForm.description"
                  class="form-textarea"
                  placeholder="Descrivi brevemente il progetto, le funzionalità richieste e gli obiettivi..."
                  rows="5"
                  required
                ></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-gold" id="contact-submit">
                  <i class="pi pi-send"></i>
                  Invia proposta
                </button>
              </div>

              <!-- Success Message -->
              <transition name="fade">
                <div v-if="formSubmitted" class="form-success">
                  <i class="pi pi-check-circle"></i>
                  <span>Richiesta inviata con successo! Ti ricontatterò al più presto.</span>
                </div>
              </transition>
            </form>

            <!-- Social Contact -->
            <div class="social-section">
              <p class="social-label">Oppure contattami sui social</p>
              <div class="social-buttons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="social-btn social-facebook" id="social-facebook">
                  <i class="pi pi-facebook"></i>
                  <span>Facebook</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-btn social-instagram" id="social-instagram">
                  <i class="pi pi-instagram"></i>
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useProgettiStore } from '@/stores/progetti'
import { useCurriculumStore } from '@/stores/curriculum'

const store = useProgettiStore()
const curriculumStore = useCurriculumStore()

const contactForm = reactive({
  title: '',
  technologies: [],
  description: ''
})

const formSubmitted = ref(false)

function handleSubmit() {
  console.log('Contact form submitted:', { ...contactForm })
  formSubmitted.value = true
  setTimeout(() => {
    formSubmitted.value = false
    contactForm.title = ''
    contactForm.technologies = []
    contactForm.description = ''
  }, 4000)
}
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
  margin-bottom: 80px;
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

.btn-explore:hover {
  background: color-mix(in srgb, var(--accent, var(--gold)) 10%, transparent);
  border-color: var(--accent, var(--gold));
  transform: translateX(4px);
}

.btn-explore:hover i {
  transform: translateX(4px);
}

/* Contact Form */
.contact-section {
  max-width: 780px;
  margin: 0 auto;
}

.contact-card {
  padding: 48px 40px;
  position: relative;
  border-color: var(--border-gold);
  overflow: hidden;
  text-align: center;
}

.cta-glow {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(212, 175, 55, 0.08), transparent);
  pointer-events: none;
}

.cta-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-white);
  margin-bottom: 12px;
  position: relative;
}

.cta-text {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 32px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

/* Form */
.contact-form {
  text-align: left;
  position: relative;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.form-label i {
  color: var(--gold);
  font-size: 0.85rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 18px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s var(--ease-smooth);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-glow);
  background: var(--bg-card-hover);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.7;
}

/* Tech Chips Multi-select */
.tech-select-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.tech-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
  user-select: none;
}

.tech-chip-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s;
}

.tech-chip:hover {
  border-color: var(--border-gold);
  background: var(--gold-subtle);
}

.tech-chip:hover .tech-chip-label {
  color: var(--gold);
}

.tech-chip.selected {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border-color: var(--gold);
}

.tech-chip.selected .tech-chip-label {
  color: var(--bg-primary);
  font-weight: 600;
}

/* Submit & Success */
.form-actions {
  text-align: center;
  margin-top: 8px;
}

.form-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding: 14px 20px;
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid rgba(72, 187, 120, 0.25);
  border-radius: var(--radius-sm);
  color: #48bb78;
  font-size: 0.92rem;
  font-weight: 500;
}

.form-success i {
  font-size: 1.1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Social Buttons */
.social-section {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
}

.social-label {
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-bottom: 16px;
  letter-spacing: 0.3px;
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.social-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s var(--ease-smooth);
  border: 1px solid var(--border-subtle);
}

.social-btn i {
  font-size: 1.1rem;
}

.social-facebook {
  color: #4267B2;
  background: rgba(66, 103, 178, 0.08);
  border-color: rgba(66, 103, 178, 0.2);
}

.social-facebook:hover {
  background: rgba(66, 103, 178, 0.18);
  border-color: #4267B2;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(66, 103, 178, 0.2);
}

.social-instagram {
  color: #E1306C;
  background: rgba(225, 48, 108, 0.08);
  border-color: rgba(225, 48, 108, 0.2);
}

.social-instagram:hover {
  background: rgba(225, 48, 108, 0.18);
  border-color: #E1306C;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(225, 48, 108, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .project-preview {
    height: 180px;
  }

  .contact-card {
    padding: 32px 20px;
  }

  .tech-select-grid {
    gap: 6px;
  }

  .tech-chip {
    padding: 6px 12px;
  }

  .tech-chip-label {
    font-size: 0.8rem;
  }

  .social-buttons {
    flex-direction: column;
    align-items: center;
  }

  .social-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
