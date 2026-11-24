import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import { reveal, installSpotlight } from './directives/reveal'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('reveal', reveal)

app.mount('#app')
installSpotlight()
