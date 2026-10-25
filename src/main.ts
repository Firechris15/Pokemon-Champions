import { mount } from 'svelte';
import './ui/styles/global.css';
import App from './ui/App.svelte';
import { initPwa } from './ui/pwa.svelte.ts';

// iPad: Pinch-Zoom und Doppeltipp-Zoom würden die Touch-Bedienung stören.
document.addEventListener('gesturestart', (event) => {
  event.preventDefault();
});

const target = document.getElementById('app');
if (!target) throw new Error('#app fehlt in index.html');

mount(App, { target });
initPwa();
