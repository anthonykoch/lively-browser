

# Lively browser example

## Todo

### Major

- [ ] Fix member expression notifier being undeclared
- [ ] Fix the errors not going away/clearing of old phantoms.
- [x] Figure out why `var user = {};` causes it to not clean up older phantoms.
- [x] Fix undefined phantom class
- [ ] Fix error where `setTimeout(() => {}, 0)` returns a number and moving the cursor to the same line causes the phantom to be erased.


### Minor

- [ ] Customize eslint and get rid of whack rules
- [ ] Make lines after an error opaque



Phantom Possibilities:

- Keep track of all line elements in the viewport onViewportChange and update each one accordingly.

