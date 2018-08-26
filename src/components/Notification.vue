<template>
  <div
    :class="Object.assign({}, {
      'is-sizeSmall': size === 'small',
      'is-sizeLarge': size === 'large',
    }, classes)"
    :style="Object.assign({}, styles)"
    class="Notification"
    role="alert"
  >
    <div class="Notification-body">
      <button class="Notification-close">&times;</button>
      <div
        v-if="typeof message === 'string'"
        class="Notification-message"
        v-html="message"
      ></div>
      <div
        v-if="typeof message !== 'string'"
        class="Notification-message"
      >
        <slot></slot>
      </div>
      <div
        v-if="actions.length"
        class="Notification-actions"
      >
        <button
          v-for="action in actions"
          :key="action.id"
          class="Notification-actionItem"
          @click="$emit('action', action.id)"
        >{{ action.text }}</button>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  created() {
    console.log(this.$props);

  },

  props: {
    styles: {
      type: Object,
      default: () => ({}),
    },

    classes: {
      type: Object,
      default: () => ({}),
    },

    actions: {
      type: Array,
      default: () => [],
    },

    size: {
      type: String,
      default: 'large',
      validator(value) {
        return ['small', 'large'].includes(value);
      },
    },

    message: {
      type: String,
      default: null,
    },
  },
};

</script>

<style lang="scss">

.Notification {
  background-color: $app-notification-background-default;
  border-radius: $app-notification-border-radius;
  color: $app-notification-color-default;
  box-shadow: $app-box-shadow-1;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 400px;
  padding-top: $app-notification-padding-y;
  padding-bottom: $app-notification-padding-y;
  position: relative;
  width: auto;

  &:before {
    border-bottom: 11px solid transparent;
    border-left: 8px solid $app-notification-background-default;
    border-top: 11px solid transparent;
    content: '';
    position: absolute;
    top: 0.5rem;
    right: 2px;
    transform: translate(100%, 0);
  }

  &.is-sizeSmall {
    padding-top: $app-notification-padding-small-y;
    padding-bottom: $app-notification-padding-small-y;

    .Notification-actions {
      padding-left: $app-notification-padding-small-x;
      padding-right: $app-notification-padding-small-x;
    }

    .Notification-message {
      padding-left: $app-notification-padding-small-x;
      padding-right: $app-notification-padding-small-x;
    }
  }
}

.Notification.is-error {
  background-color: $app-notification-background-error;
  color: $app-notification-color-error;
  text-shadow: 0 1px 1px rgba(black, 0.1);

  &:before {
    border-left-color: $app-notification-background-error;
  }
}

.Notification-body {
  position: relative;
}

.Notification-close {
  @include button;
  display: none;
  color: #2b292b;
  font-size: 24px;
  position: absolute;
  padding: 6px 8px;
  right: 0;
  top: 0;
}

.Notification-message {
  color: inherit;
  font-size: 12px;
  line-height: 1.8;
  padding-left: $app-notification-padding-x;
  padding-right: $app-notification-padding-x;
}

// - Orange #f29100
// - Seafoam #9bc2d8

.Notification-actions {
  background-color: rgba(white, 0.06);
  padding-left: $app-notification-padding-x;
  padding-right: $app-notification-padding-x;
  margin-top: 6px; text-align: right;
}

.Notification-actionItem {
  background-color: #ef276d;
  background-color: #e8b92c;
  background-color: transparent;
  border: 1px solid rgba(black, 0.6);
  border-radius: 3px;
  font-family: inherit;
  color: rgba(black, 0.82);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.5;
  outline: 0;
  padding: 4px 16px;
  transition-duration: 250ms;
  transition-property: background-color, color, box-shadow;
  user-select: none;

  &:hover {
    background-color: rgba(black, 0.82);
    color: white;
  }
}

</style>
