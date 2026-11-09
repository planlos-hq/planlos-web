<template>
  <b-app>
    <!--
    useToast() darf nur innerhalb der BApp-Komponente aufgerufen werden. Es braucht eine einfache Wrapper-Komponente, die dort drin liegt.
    Es funktioniert kein OnMounted, da dies außerhalb des Gültigkeitsbereiches liegen würde.
    -->
    <toast-init />
    <!-- Auch ohne Verbindung bleibt die Oberfläche stehen, der Hinweis liegt über dem Kalender -->
    <router-view />
  </b-app>
</template>

<script setup lang="ts">
  import { RouterView } from "vue-router";
  import { BApp } from "bootstrap-vue-next";
  import { defineComponent } from "vue";
  import { useNotification } from "./composables/useNotification";

  const toastInit = defineComponent({
    setup() {
      const { initialize } = useNotification();
      initialize();
      //Es soll nichts gerendert werden
      return () => null;
    },
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
