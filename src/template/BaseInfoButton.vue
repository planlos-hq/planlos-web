<template>
  <div class="info-btn-container" :style="{ right: offset + 'px' }">
    <button class="info-btn" @click="show = true">
      <slot name="label">{{ label }}</slot>
    </button>

    <b-modal v-model="show" :title="title" no-footer centered>
      <slot></slot>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { BModal } from "bootstrap-vue-next";

  defineProps<{
    label: string;
    title: string;
    offset: number;
  }>();

  const show = ref(false);

  defineExpose({
    show: (val: boolean) => (show.value = val),
  });
</script>

<style scoped>
  .info-btn-container {
    position: fixed;
    bottom: 10px;
    z-index: 1000;
  }

  .info-btn {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
    width: 80px;
    opacity: 1;
  }

  .info-btn:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: #ccc;
    color: #333;
    opacity: 1;
  }
</style>
