<template>
  <div class="button-wrapper">
    <icon-button :size="size" class="icon-button">
      <alert-triangle :size="size" class="icon-button" />
    </icon-button>

    <span v-if="conflictCount > 0" class="badge" :class="badgeClass">
      {{ conflictCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
  import { AlertTriangle } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";
  import { computed } from "vue";

  const props = defineProps<{
    /**Größe des Icons in px */
    size: number;

    /**Anzahl der Konklikte*/
    conflictCount: number;
  }>();

  const badgeClass = computed(() => {
    if (props.conflictCount >= 20) return "critical";
    if (props.conflictCount >= 5) return "warning";
    return "normal";
  });
</script>

<style scoped lang="css">
  .icon-button {
    padding: 1%;
  }

  .button-wrapper {
    display: inline-block;
    position: relative;
  }

  .badge {
    align-items: center;
    background-color: #ffbc48;
    border-radius: 50%;
    bottom: -6px;
    color: white;
    display: inline-flex;
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 600;
    height: 1.4rem;
    justify-content: center;
    line-height: 1;
    margin-left: 0.4rem;
    min-width: 1.4rem;
    padding: 0 0.4rem;
    position: absolute;
    right: -6px;
  }

  .normal {
    background-color: #ffbc48;
  }

  .warning {
    background-color: #ef6c44;
  }

  .critical {
    background-color: #991b1b;
  }
</style>
