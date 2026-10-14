<template>
  <div class="base-layout">
    <div class="side-bar">
      <slot name="sidebar"></slot>
    </div>
    <div class="content">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<style scoped>
  .base-layout {
    display: grid;
    grid-template-columns: 1fr 5fr;
    grid-template-rows: 1fr;
    height: 100vh;
    overflow: hidden;
    width: 100vw;
  }

  .side-bar {
    display: flex;
    flex-direction: column;
    grid-column: 1;
    grid-row: 1;
    height: 100%;
    overflow: hidden;
  }

  .content {
    grid-column: 2;
    grid-row: 1;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
</style>
