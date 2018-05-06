

# Lively browser example

## Todo

- [ ] {H} Create gifs for how things work
- [ ] {H} Non-walkthrough should only get the first ten
- [x] {H} Turn keybindings on/off for walkthrough when walkthrough is turned on/off
- [x] {H} Exiting out of modal through exit button does not leave settings up to date the next time the settings are open.
- [x] {M} Limit phantoms to 10 items per line and show a popup for more items (solved by ellipsis)
- [ ] {M} Don't show phantom popup when walthrough is going for the same insertions
- [x] {M} Switching from minimal to thorough setting should not step through walkthrough until the code has been executed again under thorough instrumentation.
- [x] {M} Error coverage points
- [x] {L} Error coverage points for all frames in the stack
- [x] {H} Walkthrough should not stop after 10 insertion points
- [ ] {L} Improve walkthrough UI buttons
- [x] {H} Keybindings for walkthrough, code execution
- [x] {H} (Needs fixing) Erase all coverage and phantoms below the area that was typed
- [x] {H} Fix how settings are stored
- [ ] {L} Add shadow to gutter when scrolled right
- [ ] {L} Fix close button on popups (for right now removing them works as they're not necessary)
- [x] {L} Don't show popups for after a modified line
- [ ] {L} Erase phantom if the change is from the same line and ch 0
- [ ] {L} Allow viewing the result of an expression from a selection, whether the selection is empty or not.
- [x] {L} Put all tokens in a single array and distinguish each token by its type property
- [ ] {L} Run script as you type
- [ ] {L} Automatic walkthrough
- [ ] {L} An interface for viewing all expressions
- [ ] {L} (optimization) Stop concatenating phantom content together when the line length has reached 40-50 chars.

- [x] Fix member expression notifier being undeclared
- [x] Fix the errors not going away/clearing of old phantoms.
- [x] Figure out why `var user = {};` causes it to not clean up older phantoms.
- [x] Fix undefined phantom class
- [x] Fix error where `setTimeout(() => {}, 0)` returns a number and moving the cursor to the same line causes the phantom to be erased.
- Add a gif that illustrates what shit does


- [ ] {L} Customize eslint and get rid of whack rules
- [ ] {L} Make lines after an error opaque, maybe even lines that haven't run ?



