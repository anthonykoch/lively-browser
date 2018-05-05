<template>
  <transition>
    <app-overlay
      v-show="isShowing"
      :allow-close="allowOverlayClose"
      @request-close="onOverlayRequestClose"
    >
      <app-modal
        :id="modalId"
        @close="onModalRequestClose"
      >
        <app-settings
          ref="settings"
          :settings="settings"
          @confirm-changes="onConfirmChanges"
        ></app-settings>
      </app-modal>
    </app-overlay>
  </transition>
</template>

<script>

export default {
  name: 'ModalSettings',

  components: {
    AppSettings: require('@/components/Settings').default,
    AppModal: require('@/components/Modal').default,
    AppOverlay: require('@/components/Overlay').default,
  },

  props: {
    allowSaveSettings: {
      type: Boolean,
      default: () => true,
    },

    allowOverlayClose: {
      type: Boolean,
      default: () => true,
    },

    isShowing: {
      type: Boolean,
      required: true,
    },

    settings: {
      type: Object,
      required: true,
    },

    modalId: {
      type: String,
      default: () => 'modal-settings',
    },
  },

  methods: {
    onConfirmChanges(settings) {
      if (this.allowSaveSettings) {
        this.$store.dispatch('updateSettings', settings);
      }

      this.$emit('confirm-changes');
    },

    onOverlayRequestClose() {
      this.$refs.settings.discardLiveSettings();
      this.$emit('overlay-request-close');
    },

    onModalRequestClose() {
      this.$refs.settings.discardLiveSettings();
      this.$emit('modal-request-close');
    },
  },
};

</script>
