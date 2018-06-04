
import assert from 'assert';

import cuid from 'cuid';
import Keyboard from 'keyboardjs';

export const assertValidShortcut = (shortcut) => {
  if (typeof shortcut.on !== 'function') {
    throw new Error(`Invalid shortcut configuration, shortcut.on should be a function, got ${shortcut.on}`);
  }

  if (!Array.isArray(shortcut.keys)) {
    throw new Error(`Invalid shortcut configuration, shortcut.key should be an array, got ${shortcut.keys}`);
  }

  if (!shortcut.keys.every(key => typeof key === 'string')) {
    throw new Error(`Invalid shortcut configuration, shortcut key should be a string, got ${shortcut.keys}`);
  }

  if (!(shortcut.hasOwnProperty('when') ? typeof shortcut.when === 'function' : true)) {
    throw new Error(`Invalid shortcut configuration, shortcut.when was passed but is not a function, got ${shortcut.when}`);
  }

  if (typeof shortcut.name !== 'string') {
    throw new Error(`Invalid shortcut configuration, shortcut.name is not a string, got ${shortcut.name}`);
  }
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
      id: cuid(),
      name: shortcut.name,
      keys,
      listener,
      destroy,
    };
  });
};

export const unbindShortcuts = ({ shortcuts }) => {
  shortcuts.forEach((shortcut) => shortcut.destroy());
};

let activeShortcuts = [];

const removeActiveShortcuts = (boundShortcuts) => {
  activeShortcuts = activeShortcuts.filter(active => {
    return boundShortcuts.some(bound => active.id === bound.id);
  });

  return activeShortcuts.slice(0);
};

const addActiveShortcuts = (boundShortcuts) => {
  for (const bound of boundShortcuts) {
    if (activeShortcuts.every(active => active.id !== bound.id)) {
      activeShortcuts.push(bound)
    }
  }

  return activeShortcuts.slice(0);
};

const assertHasShortcut = (name) => {
  if (activeShortcuts.every(shortcut => shortcut.name !== name)) {
    throw new Error(`could not find shortcut for name "${shortcutName}"`);
  }
};

export default {
  install(Vue, { humanize: humanizeFormatter }={}) {


    /**
     * Returns a human readable from the name of a shortcut.
     *
     * @throws {Error} if the shortcut name does not map to an existing shortcut.
     * @param  {String} shortcutName
     * @return {String}
     */
    const humanize = (shortcutName) => {
      const binding = activeShortcuts.find(item => item.name === shortcutName);

      assertHasShortcut(shortcutName);

      if (typeof humanizeFormatter === 'function') {
        return humanizeFormatter(binding.keys, binding);
      }

      return `(${binding.keys.join(', ')})`;
    };

    /**
     * Returns a mapping of arbirary keys to humanized shortcut keys.
     *
     * @param  {Object} obj - A mapping of arbitrary keys to shortcut names
     */
    const humanizeEntries = (obj) => {
      return Object.keys(obj)
        .reduce((all, name) => {
          all[name] = humanize(obj[name]);

          return all;
        }, {});
    };

    Vue.prototype.$shortcuts = {
      humanize,
      humanizeEntries,
    };

    /**
     * Sets shortcuts to be bound to the window
     * @param {Array<Shortcut>} shortcuts
     */
    Vue.setShortcuts = function ({ $store, shortcuts }) {
      if ($store == null || typeof $store !== 'object') {
        throw new Error(`$store should be an object, got ${$store}`);
      };

      if (!Array.isArray(shortcuts)) {
        throw new Error(`Shortcuts should be an array, got ${shortcuts}`);
      }

      const boundShortcuts = bindShortcuts({ $store, shortcuts });

      addActiveShortcuts(boundShortcuts);

      return activeShortcuts.slice(0);
    };

    Vue.unsetShortcuts = function ({ shortcuts }) {
      if (!Array.isArray(shortcuts)) {
        throw new Error(`Shortcuts should be an array, got ${shortcuts}`);
      }

      removeActiveShortcuts(shortcuts);
      unbindShortcuts({ shortcuts });

      return activeShortcuts.slice(0);
    };

    Vue.prototype.getActiveMemes = () => activeShortcuts;
  },
};
