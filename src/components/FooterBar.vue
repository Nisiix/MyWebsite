<template>
  <footer class="footer">
    <div class="footer-glow"></div>
    <div class="container footer-inner">
      <p class="footer-copy">
        &copy; {{ currentYear }} Nisiix Dev · {{ $t('footer.madeWith') }}
        <i class="pi pi-heart-fill" style="color: var(--gold); font-size: 0.8rem;" :aria-label="$t('footer.heart')"></i>
        {{ $t('footer.andCode') }}
      </p>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer {
  position: relative;
  padding: 40px 0;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.footer-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-copy {
  color: var(--text-muted);
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
