<template>
  <transition-group
    name="t-EditorNotificationList-item"
    tag="ul"
    class="EditorNotificationList"
  >
    <li
      v-for="notification in items"
      v-if="notification.isShowing"
      :key="notification.id"
      class="EditorNotificationList-item"
    >
      <app-editor-notification :notification="notification"></app-editor-notification>
    </li>
  </transition-group>
</template>

<script>

export default {

  components: {
    AppEditorNotification: require('@/components/EditorNotification').default,
  },

  props: {
    items: {
      type: Array,
      required: true,
    },
  },

};

</script>

<style lang="scss">

.EditorNotificationList {
  top: 1rem;
  right: 5rem;
  list-style-type: none;
  position: absolute;
  z-index: $app-editor-notification-layer;
}

.EditorNotificationList-item {
  display: block;
  transform-origin: top center;
  transition: all 400ms;
}




.t-EditorNotificationList-item-enter {
  opacity: 0;
  transform: translate(0, -100px) scale(0.7);
}

.t-EditorNotificationList-item-enter-active {
  transition: all 450ms cubic-bezier(0.23, 1.25, 0.32, 1);
  transform-origin: top right;
}

.t-EditorNotificationList-item-leave-to {
  opacity: 0;
  transform: translate(-80px, 0) scale(1);
}

.t-EditorNotificationList-item-leave-active {
  position: absolute;
  right: 0;
  transition: all 600ms cubic-bezier(0.19, 1, 0.22, 1);
}

</style>
