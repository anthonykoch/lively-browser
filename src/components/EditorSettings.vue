<template>
  <transition>
    <app-overlay
      :allow-close="true"
      @request-close="@emit('request-close')"
    >
      <app-modal
        id="settings"
        @close="$emit('request-close')"
      >
        <div class="Settings">
          <header class="Settings-header">
            <h1 class="Settings-title">Settings</h1>
          </header>

          <div class="Settings-container">
            <div class="Settings-content">
              <div class="Settings-group">
                <label
                  for="editors_settings_mode"
                  class="Settings-label"
                >
                  <span>Execution Mode: </span>
                </label>
                <select
                  id="editors-settings-mode"
                  v-model="userSettings['execution.mode']"
                  name="editors_settings_mode"
                  class="Settings-select"
                >
                  <option value="manual">Manual (via ctrl+enter)</option>
                  <option
                    value="automatic"
                    disabled
                  >
                    Automatic (as you type)
                  </option>
                </select>
                <p class="Settings-description">
                  Manual mode only executes code with ctrl+enter. Automatic (currently unavailable) will execute code ever n ms after typing.
                </p>
              </div>
              <div class="Settings-group">
                <label
                  for="execution"
                  class="Settings-label"
                >
                  Walkthrough:
                </label>
                <input
                  type="checkbox"
                  v-model="userSettings['execution.walkthrough']"
                  id="execution"
                  name="execution"
                >
                <span class="Settings-subtitle">(Slower when checked)</span>
                <!-- <select
                  id="execution"
                  name="execution"
                  class="Settings-select"
                  v-model="userSettings['execution.walkthrough']"
                  @change="updateSettings('execution.mode', '')"
                >
                  <option value="minimal">Normal (faster)</option>
                  <option value="thorough">Walkthrough (slower)</option>
                </select> -->
                <p class="Settings-description">
                  Normal execution will execute the code, give coverage feedback, and will render values for identifier expressions. Walkthrough will do all of that, but also allows a walkthrough of how the expressions resolved.
                </p>
              </div>
            </div>
          </div>
          <div class="Settings-actionList">
            <button
              class="Settings-save"
              @click="onSettingSaveClick"
            >
              Save
            </button>
          </div>
        </div>
      </app-modal>
    </app-overlay>
  </transition>
</template>



<style scoped lang="scss">

$app-editor-settings-border-radius: 4px;
$app-editor-settings-background-color: $color-gray;

.Settings-header {
  background-color: $app-editor-settings-background-color;
  border-radius: $app-editor-settings-border-radius $app-editor-settings-border-radius 0 0;
}

.Settings-title {
  border-bottom: 1px solid rgba(black, 0.1);
  font-size: 32px;
  line-height: 1.1;
  font-weight: 200;
  letter-spacing: 3px;
  margin: 0;
  padding-bottom: 1rem;
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 1rem;
}

.Settings-container {
  overflow: hidden;
  background-color: white;
}

.Settings-content {
  // box-shadow: 3px 6px 20px 0px rgba(0,0,0,0.2);
  max-height: 500px;
  overflow: auto;
  position: relative;
  margin-bottom: 32px;
  padding-left: 2rem;
  padding-right: 2rem;
  margin-top: 32px;
  z-index: 1;

  > :last-child {
    margin-bottom: 0;
  }
}

.Settings-subtitle {
  font-size: 11px;
  margin-left: 3px;
}

.Settings-group {
  margin-bottom: 24px;
}

.Settings-select {
  font-size: 14px;
}

.Settings-label {
  font-size: 12px;
  font-weight: 600;
  // display: block;
  margin-bottom: 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.Settings-description {
  font-size: 13px;
  line-height: 1.8;
  margin-top: 10px;
}

.Settings-actionList {
  // display: flex;
}

// .Settings-actionList > :first-child {
//   border-right: 1px solid rgba(black, 0.06);
//   border-bottom-left-radius: 4px;
// }

// .Settings-actionList > :last-child {
//   border-bottom-right-radius: 4px;
//   background-color: #eaaa5d;
// }

// .Settings-discard {
//   background-color: transparent;
//   border: 0;
//   font-size: 14px;
//   cursor: pointer;
//   margin-bottom: 1rem;
//   margin-right: 1rem;
// }

.Settings-save {
  background: #d6c96b;
  // background-color: #5abef9;
  // background-color: $color-gray;
  border: 0;
  border-top: 1px solid rgba(black, 0.1);
  border-radius: 0 0 $app-editor-settings-border-radius $app-editor-settings-border-radius;
  cursor: pointer;
  color: white;
  display: block;
  font-family: Montserrat;
  font-size: 15px;
  font-weight: 400;
  outline: 0;
  padding: 1rem 0;
  text-align: center;
  user-select: none;
  // width: 50%;
  width: 100%;

  &:link,
  &:visited,
  &:hover,
  &:active {
    color: white;
  }
}

</style>
