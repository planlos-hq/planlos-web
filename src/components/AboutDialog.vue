<template>
  <base-info-button label="About" title="Über uns" :offset="95" ref="baseBtn">
    <template #label>
      <span @click.stop="openAbout">About</span>
    </template>
    <div class="about-content text-center">
      <img src="/logo/PlanLos_logo_schrift.png" alt="PlanLos Logo" class="logo-schrift mb-4" />
      <img v-if="currentImage" :src="currentImage" alt="Team" class="team-photo mb-3" />
      <info-section-content :section="settings.about" />
    </div>
  </base-info-button>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import BaseInfoButton from "@/template/BaseInfoButton.vue";
  import InfoSectionContent from "@/components/InfoSectionContent.vue";
  import { resolveAssetUrl, useSiteSettings } from "@/composables/useSiteSettings";

  const baseBtn = ref();
  const currentImage = ref("");
  const settings = useSiteSettings();

  function pickImage(): string {
    const { images, rare_image: rareImage } = settings.value.about;
    if (rareImage && Math.random() < 0.01) {
      return rareImage;
    }
    return images[Math.floor(Math.random() * images.length)] ?? "";
  }

  function openAbout() {
    const image = pickImage();
    currentImage.value = image ? resolveAssetUrl(image) : "";
    baseBtn.value.show(true);
  }
</script>

<style scoped>
  .team-photo {
    border-radius: 8px;
    max-height: 60vh;
    max-width: 100%;
    object-fit: contain;
  }

  .logo-schrift {
    height: auto;
    max-width: 250px;
  }
</style>
