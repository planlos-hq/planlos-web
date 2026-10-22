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
    bottom: 10px;
    position: fixed;
    z-index: 1000;
  }

  .info-btn {
    background: rgb(255 255 255 / 80%);
    border: 1px solid #eee;
    border-radius: 4px;
    color: #888;
    cursor: pointer;
    font-size: 11px;
    opacity: 1;
    padding: 3px 6px;
    transition: all 0.2s;
    width: 80px;
  }

  .info-btn:hover {
    background: rgb(255 255 255 / 90%);
    border-color: #ccc;
    color: #333;
    opacity: 1;
  }
</style>
