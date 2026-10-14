<template>
  <div class="icon-button" :style="{ '--icon-size': size + 'px' }">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    size: number;
  }>();
</script>

<style scoped>
  .icon-button {
    align-items: center;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    height: var(--icon-size);
    justify-content: center;
    transition: background-color 0.3s;
    width: var(--icon-size);
  }

  .icon-button:hover {
    background-color: var(--hover-color);
  }
</style>
