<template>
  <b-app>
    <!--
    useToast() darf nur innerhalb der BApp-Komponente aufgerufen werden. Es braucht eine einfache Wrapper-Komponente, die dort drin liegt.
    Es funktioniert kein OnMounted, da dies außerhalb des Gültigkeitsbereiches liegen würde.
    -->
    <toast-init />
    <router-view v-if="ready" />
  </b-app>
</template>

<script setup lang="ts">
  import { RouterView } from "vue-router";
  import { BApp } from "bootstrap-vue-next";
  import { defineComponent, onMounted, ref } from "vue";
  import { useNotification } from "./composables/useNotification";
  import { useSettingsStore } from "./stores/settingsStore";

  const toastInit = defineComponent({
    setup() {
      const { initialize } = useNotification();
      initialize();
      //Es soll nichts gerendert werden
      return () => null;
    },
  });

  const settingsStore = useSettingsStore();
  const ready = ref(false);

  onMounted(async () => {
    settingsStore.initializeSettings();
    ready.value = true;
  });
</script>

<style>
  html,
  body,
  #app {
    height: 100%;
    margin: 0;
    overflow: hidden;
  }
</style>
