<template>
  <b-app>
    <!--
    useToast() darf nur innerhalb der BApp-Komponente aufgerufen werden. Es braucht eine einfache Wrapper-Komponente, die dort drin liegt.
    Es funktioniert kein OnMounted, da dies außerhalb des Gültigkeitsbereiches liegen würde.
    -->
    <toast-init />
    <connection-error-view v-if="connectionStore.hasConnectionError" />
    <router-view v-else />
  </b-app>
</template>

<script setup lang="ts">
  import { RouterView } from "vue-router";
  import { BApp } from "bootstrap-vue-next";
  import { defineComponent } from "vue";
  import { useNotification } from "./composables/useNotification";
  import { useConnectionStore } from "./stores/connectionStore";
  import ConnectionErrorView from "./views/ConnectionErrorView.vue";

  const toastInit = defineComponent({
    setup() {
      const { initialize } = useNotification();
      initialize();
      //Es soll nichts gerendert werden
      return () => null;
    },
  });

  const connectionStore = useConnectionStore();
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
