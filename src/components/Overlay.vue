<template>
  <div
    class="Overlay"
    @click="onClick"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {

  name: 'Overlay',

  props: {
    allowClose: {
      type: Boolean,
      default: true,
    }
  },

  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },

  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  },

  methods: {
    onClick(e) {
      if (e.target === this.$el) {
        this.$emit('request-close', { escape: false, });
      }
    },

    onKeydown(e) {
      if (e.which === 27) {
        this.$emit('request-close', { escape: true, });
      }
    },
  },

};
</script>


<style lang="scss">

.Overlay {
  // background-color: rgba(black, 0.2);
  height: 100%;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: $app-overlay-layer;
}

</style>
