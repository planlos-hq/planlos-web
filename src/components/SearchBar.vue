<template>
  <div class="search-bar">
    <b-input-group size="md" class="m-0">
      <b-form-input
        class="flex-grow-1"
        v-model="searchText"
        type="search"
        :placeholder="`Suche...`"
      />

      <template #append>
        <b-button variant="primary">
          <search :size="24" />
        </b-button>
      </template>
    </b-input-group>
  </div>
</template>

<script setup lang="ts">
  import { Search } from "lucide-vue-next";
  import { ref, watch } from "vue";
  import { BButton, BInputGroup, BFormInput } from "bootstrap-vue-next";

  const emit = defineEmits(["new-search"]);

  const searchText = ref("");

  watch(searchText, () => {
    //If any input changes, the search will update
    emit("new-search", searchText.value);
  });
</script>

<style scoped>
  .search-icon {
    padding: 3%;
  }

  .search-bar {
    padding: 3%;
  }

  .label {
    font-size: large;
    margin: 3%;
  }
</style>
