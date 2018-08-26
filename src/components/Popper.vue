<template>
  <div>
    <div ref="container">
      <transition-group
        v-bind="transition"
        @before-enter="onTransitionBeforeEnter"
      >
        <slot></slot>
      </transition-group>
    </div>
    <slot name="reference"></slot>
  </div>
</template>

<script>
import Popper from 'popper.js';

/**
 * A wrapper around PopperJS popup positioning library.
 */
export default {
  props: {
    /**
     * Popper options
     */
    options: {
      type: Object,
      required: true,
    },

    /**
     * Allows transitioning the popper element
     */
    transition: {
      type: Object,
      default: () => ({}),
    },
  },

  watch: {
    'options.placement'() {
      this.popper.scheduleUpdate();
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.updateElements();
      this.updatePopper();
      this.popper.scheduleUpdate();
    });
  },

  destroyed() {
    if (this.popper) {
      this.popper.destroy();
    }

    this.popper = null;
  },

  methods: {
    onTransitionBeforeEnter(el) {
      // Can't do scheduleUpdate because we need this to be synchronous
      this.popper.scheduleUpdate()
    },

    /**
     * Destroys and cleans up the popper
     */
    destroyPopper() {
      this.popper.destroy();
      this.popper = null
    },

    /**
     * Creates a new popper and assigns it to the component
     */
    updatePopper() {
      if (this.popper) {
        this.destroyPopper();
      }

      this.popper = this.createPopper();
    },

    /**
     * Creates the popper controller
     */
    createPopper() {
      return new Popper(this.referenceElement, this.popperElement, this.options);
    },

    /**
     * Updates the references to the elements on the component
     */
    updateElements() {
      const elements = this.getElements();

      this.referenceElement = elements.referenceElement;
      this.popperElement = elements.popperElement;
    },

    getElements() {
      const referenceElement =
        // Yes, nested ternaries. Sue me.
        this.reference
          ?
            this.reference
          : this.$slots.reference
              ? this.$slots.reference[0].elm
              : null;

      const popperElement = this.$refs.container;

      if (referenceElement == null || referenceElement.nodeType !== 1) {
        throw new Error(`Invalid element from $slot "reference", got ${this.referenceElement}`);
      }

      return {
        popperElement,
        referenceElement,
      };
    },
  },
};
</script>
