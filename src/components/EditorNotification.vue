<template>
  <div
    role="alert"
    class="EditorNotification"
  >
    <div class="EditorNotification-body">
      <button class="EditorNotification-close">&times;</button>
      <p class="EditorNotification-message">
        {{ notification.message }}
      </p>
    </div>
  </div>
</template>

<script>

export default {

  props: {
    notification: {
      type: Object,
      required: true,
    },
  },

};

</script>

<style lang="scss">

.EditorNotification {
  background-color: $app-editor-notification-background-default;
  border-radius: $app-editor-notification-border-radius;
  color: $app-editor-notification-color-default;
  box-shadow: $app-box-shadow-1;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
  padding-top: $app-editor-notification-padding-y;
  position: relative;
  width: 400px;

  &:before {
    border-bottom: 11px solid transparent;
    border-left: 8px solid $app-editor-notification-background-default;
    border-top: 11px solid transparent;
    content: '';
    position: absolute;
    top: 0.5rem;
    right: 2px;
    transform: translate(100%, 0);
  }
}

.EditorNotification.is-error {
  background-color: $app-editor-notification-background-error;
  color: $app-editor-notification-color-error;
  text-shadow: 0 1px 1px rgba(black, 0.1);

  &:before {
    border-left-color: $app-editor-notification-background-error;
  }
}

.EditorNotification-body {
  position: relative;
}

.EditorNotification-close {
  @include button;
  display: none;
  color: #2b292b;
  font-size: 24px;
  position: absolute;
  padding: 6px 8px;
  right: 0;
  top: 0;
}

.EditorNotification-message {
  color: inherit;
  font-size: 12px;
  line-height: 1.8;
  padding-left: $app-editor-notification-padding-x;
  padding-right: $app-editor-notification-padding-x;
  padding-bottom: $app-editor-notification-padding-y;
}

// - Orange #f29100
// - Seafoam #9bc2d8

.EditorNotification-actions {
  background-color: rgba(white, 0.06);
  padding: 0.5rem 1rem 1rem;
  text-align: right;
}

.EditorNotification-actionItem {
  background-color: #ef276d;
  background-color: #e8b92c;
  background-color: transparent;
  // background-color: #f29100;
  // box-shadow: 0 2px 4px 0 rgba(black, 0.15);
  // border: 1px solid transparent;
  border: 1px solid rgba(black, 0.6);
  border-radius: 3px;
  font-family: inherit;
  // color: white;
  color: rgba(black, 0.82);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.5;
  outline: 0;
  padding: 6px 20px;
  transition-duration: 250ms;
  transition-property: background-color, color, box-shadow;
  user-select: none;

  &:hover {
    background-color: rgba(black, 0.82);
    color: white;
    // box-shadow: 0 7px 10px 0 rgba(black, 0.2);
  }
}

</style>
