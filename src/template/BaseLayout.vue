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
    display: flex;
    height: 100vh;
    overflow: hidden;
    width: 100vw;
  }

  .side-bar {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    height: 100%;
    max-width: 500px;
    min-width: 200px;
    overflow: hidden;
  }

  .content {
    flex: 5 1 0;
    height: 100%;
    min-width: 0;
    overflow: hidden;
  }
</style>
