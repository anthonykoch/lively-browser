<template>
  <transition-group
    name="tr-Notification"
    tag="ul"
    class="NotificationList"
  >
    <li
      v-for="notification in items"
      v-if="notification.isShowing"
      :key="notification.id"
      class="NotificationList-item"
    >
      <app-notification
        :message="notification.message"
        :size="notification.size"
      ></app-notification>
    </li>
  </transition-group>
</template>

<script>

export default {
  components: {
    AppNotification: require('@/components/Notification').default,
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

.NotificationList {
  top: 1rem;
  right: 5rem;
  list-style-type: none;
  position: absolute;
  z-index: $app-notification-layer;
}

.NotificationList-item {
  display: block;
  transform-origin: top center;
  transition: all 400ms;
}

</style>
