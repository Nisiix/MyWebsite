<template>
  <div class="notfound-page">
    <section class="notfound-hero">
      <div class="container notfound-content">
        <div class="hero-badge fade-in">
          <i class="pi pi-compass" aria-hidden="true"></i>
          <span>{{ $t('notFound.badge') }}</span>
        </div>
        <!-- Il numero 404 viene scritto dai blocchi 3D dello sfondo in questo spazio vuoto -->
        <h1 class="notfound-title">
          <span class="sr-only">404 — {{ $t('notFound.title') }}</span>
          <span class="notfound-word" data-bg-word="404" aria-hidden="true"></span>
        </h1>
        <p class="notfound-heading fade-in fade-in-delay-2" aria-hidden="true">{{ $t('notFound.title') }}</p>
        <p class="notfound-text fade-in fade-in-delay-2">{{ $t('notFound.text') }}</p>
        <router-link to="/" class="btn-gold fade-in fade-in-delay-3">
          <i class="pi pi-home" aria-hidden="true"></i>
          <span>{{ $t('notFound.back') }}</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.notfound-hero {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0 80px;
}

.notfound-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Stesso spazio della scritta in home: 5 righe di blocchi + margine */
.notfound-word {
  display: block;
  height: calc(8 * clamp(18px, 5vw, 60px));
}

.notfound-heading {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  color: var(--text-white);
  margin-bottom: 12px;
}

.notfound-text {
  color: var(--text-secondary);
  max-width: 520px;
  margin-bottom: 32px;
  line-height: 1.8;
}
</style>
