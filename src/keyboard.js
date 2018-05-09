
import assert from 'assert';

import Keyboard from 'keyboardjs';

export const assertValidShortcut = (shortcut) => {
  assert(
      typeof shortcut.on === 'function',
      `Invalid shortcut configuration, shortcut.on should be a function, got ${shortcut.on}`
    )

  assert(
      Array.isArray(shortcut.keys),
      `Invalid shortcut configuration, shortcut.key should be an array, got ${shortcut.keys}`
    );

  assert(
      shortcut.keys.every(key => typeof key === 'string'),
      `Invalid shortcut configuration, shortcut key should be a string, got ${shortcut.keys}`
    );

  assert(
      shortcut.hasOwnProperty('when') ? typeof shortcut.when === 'function' : true,
      `Invalid shortcut configuration, shortcut.when was passed but is not a function, got ${shortcut.when}`
    );
};

export const bindShortcuts = ({
  $store,
  shortcuts,
}) => {
  return shortcuts.map((shortcut) => {
    assertValidShortcut(shortcut);

    const keys = Array.from(shortcut.keys);
    const when = shortcut.when;

    const listener = (e) => {
      // If no predicate is passed then fire the shortcut
      if (when == null) {
        shortcut.on(e, $store);

        return;
      } else {
        const shouldFire = when($store.state, $store.getters);

        assert(typeof shouldFire === 'boolean', 'shortcut `when` handler did not return a boolean');

        if (shouldFire) {
          shortcut.on(e, $store);
        }
      }
    };

    keys.forEach(key => Keyboard.bind(key, listener));

    const destroy = () => {
      keys.forEach(key => {
        Keyboard.unbind(key, listener);
      });
    };

    return {
      keys,
      listener,
      destroy,
    };
  });
};


export const unbindShortcuts = ({ boundShortcuts }) => {
  boundShortcuts.forEach((shortcut) => {
    shortcut.destroy();
  });
};
