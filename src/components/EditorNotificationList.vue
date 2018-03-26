<template>
  <transition-group name="t-EditorNotificationList-item" tag="ul" class="EditorNotificationList">
    <li
      class="EditorNotificationList-item"
      v-for="notification in items"
      v-if="notification.isShowing"
      :key="notification.id"
    >
      <app-editor-notification :notification="notification"></app-editor-notification>
    </li>
  </transition-group>
</template>

<script>

import AppEditorNotification from '@/components/EditorNotification';

export default {

  props: {
    items: {
      type: Array,
      required: true,
    }
  },

  components: {
    AppEditorNotification
  },

};

</script>

<style lang="scss">

.EditorNotificationList {
  top: 1rem;
  right: 5rem;
  list-style-type: none;
  position: absolute;
  z-index: 99999;
}

.EditorNotificationList-item {
  display: block;
  transform-origin: top center;
  transition: all 400ms;
}




.t-EditorNotificationList-item-enter {
  opacity: 0;
  transform: translate(0, -100px) scale(0.4);
}

.t-EditorNotificationList-item-enter-active {
  transition: all 600ms cubic-bezier(0.23, 1.2, 0.32, 1);
}

.t-EditorNotificationList-item-leave-to {
  opacity: 0;
  transform: translate(-100px, 0) scale(1);
}

.t-EditorNotificationList-item-leave-active {
  position: absolute;
  right: 0;
  transition: all 400ms;
}

</style>
