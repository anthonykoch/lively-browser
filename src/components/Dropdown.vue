<template>
  <div class="Dropdown">
    <div class="Dropdown-container">
      <div class="Dropdown-panel">
        <div class="Dropdown-header">
          <slot name="dropdown-header">
            <span>{{ heading }}</span>
          </slot>
        </div>
        <div class="Dropdown-list">
          <div
            v-for="item in items"
            :key="item.id"
            class="Dropdown-listItem"
          >
            <button class="Dropdown-action">{{ item.text }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dropdown',

  props: {
    items: {
      type: Array,
      required: true,
    },
  },
}
</script>

<style lang="scss">

.Dropdown {
  position: relative;
}

.Dropdown-container {
  box-shadow: 0 4px 20px 0 rgba(black, 0.28);
  position: absolute;
  right: 0;
}

.Dropdown-panel {
  background-color: white;
  border-radius: $app-dropdown-border-radius;
}

.Dropdown-header {
  background-color: #34bcef;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  color: white;
  font-family: inherit;
  padding: $app-dropdown-padding-y $app-dropdown-padding-x;
}

.Dropdown-listItem {
  &:first-child {
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
  }

  &:last-child {
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
  }
}

.Dropdown-action {
  @include button;
  border-radius: inherit;
  display: block;
  max-width: 100%;
  padding: $app-dropdown-padding-y $app-dropdown-padding-x;
  text-align: left;
  transition: background-color 300ms;
  width: $app-dropdown-width;

  &:hover {
    background-color: #eeeeee;
    background-color: #34bcef;
    background-color: #eae9ea;
  }
}

</style>
