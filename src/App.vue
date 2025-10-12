<template>
  <Home />
</template>

<script setup>
import {
  getCurrentInstance,
  onMounted
} from 'vue';

import Home from './components/home.vue';

// This starter template is using Vue 3 experimental <script setup> SFCs
// Check out https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md

onMounted(() => {
  // Expose app instance globally for metaframe integration
  window.app = getCurrentInstance();
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
