<template>
  <focus-lock>
    <!--
      Dialog container related notes:
      - It is not the actual dialog window, just the container with which the script interacts.
      - It has to have the `aria-hidden="true"` attribute (if omitted, the script
      will add it on instantiation anyway).
      - It can have a different id than `my-accessible-dialog`, but it needs an `id`
      anyway.
    -->
    <div
      :aria-hidden="isHidden"
      :id="id"
    >

      <!--
        Overlay related notes:
        - It has to have the `tabindex="-1"` attribute.
        - It doesn’t have to have the `data-a11y-dialog-hide` attribute, however this is recommended. It hides the dialog when clicking outside of it.
      -->
      <div
        tabindex="-1"
        data-a11y-dialog-hide
      ></div>

      <!--
        Dialog window content related notes:
        - It is the actual visual dialog element.
        - It has to have the `role="dialog"` attribute.
        - It doesn’t have to have the `aria-labelledby` attribute however this is recommended. It should match the `id` of the dialog title.
        - It doesn’t have to have a direct child with the `role="document"`, however this is recommended.
      -->
      <div
        :aria-labelledby="titleId"
        role="dialog"
        class="Modal-content"
      >
        <div role="document">
          <!--
            Closing button related notes:
            - It does have to have the `type="button"` attribute.
            - It does have to have the `data-a11y-dialog-hide` attribute.
            - It does have to have an aria-label attribute if you use an icon as content.
          -->
          <button
            role="button"
            aria-label="Close this dialog window"
            class="Modal-close"
            @click="close"
          >
            &times;
          </button>

          <!--
            Dialog title related notes:
            - It should have a different content than `Dialog Title`.
            - It can have a different id than `dialog-title`.
          -->
          <slot :id="id"></slot>

          <!--
            Here lives the main content of the dialog.
          -->
        </div>
      </div>
    </div>
  </focus-lock>
</template>

<script>
export default {
  name: 'Modal',

  components: {
    FocusLock: require('vue-focus-lock').default,
  },

  props: {
    id: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      isHidden: true,
    };
  },

  computed: {
    titleId() {
      return `${this.id}-modal-title`;
    }
  },

  methods: {
    close() {
      this.$emit('close');
    },
  },

};
</script>

<style lang="scss">

.Modal {
  background-color: transparent;
}

.Modal-content {
  backface-visibility: hidden;
  // background-color: $color-gray;
  border-radius: 4px;
  box-shadow: $app-box-shadow-1;
  left: 50%;
  // padding: 1rem 2rem;
  max-width: 100%;
  position: absolute;
  transform: translate(-50%, -50%);
  top: 30%;
  // min-width: 280px;
  width: 600px;
}

.Modal-close {
  background-color: transparent;
  border: 0;
  font-size: 22px;
  line-height: 0.6em;
  // outline: 2px solid red;
  outline: 0;
  position: absolute;
  right: 1rem;
  top: 1rem;
}

</style>

