import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import './assets/main.css'
import { reveal, installSpotlight } from './directives/reveal'
import { spinTitle } from './directives/spinTitle'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.directive('reveal', reveal)
app.directive('spin-title', spinTitle)

app.mount('#app')
installSpotlight()
