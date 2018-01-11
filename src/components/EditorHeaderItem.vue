<template>
  <div class="EditorHeader-item" :style="style">
    <slot></slot>
  </div>
</template>

<script>
  export default {
    name: '',
    props: {
      flex: {
        type: Number,
        default: 0,
      },
    },
    data() {
      return {};
    },
    computed: {
      style() {
        return `${this.$props.flex} 0 auto`;
      },
    },
  };
</script>

<style>
.EditorHeader-item {
  // flex: 1;
  // flex-basis: auto;
}
</style>
