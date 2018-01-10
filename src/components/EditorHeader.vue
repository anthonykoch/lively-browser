<template>
  <div className="EditorHeader"><slot></slot></div>
</template>

<script>
export default {
  name: 'EditorHeader',
};
</script>

<style scoped lang="scss">

.EditorHeader {
  background-color: rgb(255, 240, 240);
  display: flex;
  flex-wrap: nowrap;
  // line-height: $app-header-height;
  // height: $app-header-height;
  min-height: $app-header-height;
  overflow: hidden;
  width: 100%;
}
</style>
