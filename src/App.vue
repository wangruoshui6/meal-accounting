<template>
  <div id="app">
    <MealRecord />
  </div>
</template>

<script setup lang="ts">
import MealRecord from './views/MealRecord.vue'
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  background-color: #f5f5f5;
}
</style>
