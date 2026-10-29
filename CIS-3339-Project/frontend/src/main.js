
import { createApp, markRaw } from "vue";
import router from "./router";
import App from "./App.vue";
import "./index.css";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import { createPinia } from 'pinia';
import { useLoggedInUserStore } from './store/loggedInUser';
import { setUnauthorizedHandler } from './api/api';

const app = createApp(App);

// Create a Pinia root store
const pinia = createPinia();

// Allow Pinia stores to use the router
pinia.use(({ store }) => {
  store.$router = markRaw(router);
});

// Install Pinia first
app.use(pinia);

// Get the user store and restore the saved session
const user = useLoggedInUserStore(pinia);
user.restoreSession();

// Clear the session and redirect to login after a 401 response
setUnauthorizedHandler(() => {
  user.clearSession();
  router.replace({ name: 'login' });
});

// Install the router after restoring the session
app.use(router);

const options = {
  position: 'bottom-right'
};

app.use(Toast, options);
app.mount("#app");
