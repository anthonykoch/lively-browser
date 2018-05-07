

# Lively browser example

## Todo

- [ ] {H} Make sure you aren't showing walkthrough popups for insertions points that have not been run yet.
- [ ] {H} See if it's possible to catch async/promise runtime errors
- [ ] {H} Add titles to buttons
- [x] {H} Allow async phantoms and insertions to be rendered.
- [x] {H} Store editor changes in local storage
- [ ] {H} Create gifs for how things work
- [x] {H} Non-walkthrough should only get the first ten
- [x] {H} Turn keybindings on/off for walkthrough when walkthrough is turned on/off
- [x] {H} Walkthrough should not stop after 10 insertion points
- [x] {H} Keybindings for walkthrough, code execution
- [x] {H} (Needs fixing) Erase all coverage and phantoms below the area that was typed
- [x] {H} Fix how settings are stored
- [x] {H} Exiting out of modal through exit button does not leave settings up to date the next time the settings are open.
- [x] {H} Fix member expression notifier being undeclared
- [x] {H} Fix the errors not going away/clearing of old phantoms.
- [x] {H} Figure out why `var user = {};` causes it to not clean up older phantoms.
- [x] {H} Fix undefined phantom class
- [x] {H} Fix error where `setTimeout(() => {}, 0)` returns a number and moving the cursor to the same line causes the phantom to be erased.

- [ ] {M} Clear walkthrough markers if it comes after a modified line.
- [ ] {M} UI for a timeline of the walkthrough. I'm thinking a strip at the bottom or top with left/right buttons of at one side and the rest. It should only show when walkthrough is enabled and should allow viewing serialized data. Would probably add a thing so that you can go to a line through a text box instead of having to scroll or press the left/right buttons.
 ```
 |----x-----x-x---x--|<|>|
 ```
- [ ] {M} Allow viewing the result of an expression from a selection, whether the selection is empty or not.
- [x] {M} Don't show phantom popup when walthrough is going for the same insertions
- [x] {M} Limit phantoms to 10 items per line and show a popup for more items (solved by ellipsis)
- [x] {M} Switching from minimal to thorough setting should not step through walkthrough until the code has been executed again under thorough instrumentation.
- [x] {M} Error coverage points

- [ ] {L} Improve walkthrough UI buttons
- [ ] {L} Add shadow to gutter when scrolled right
- [ ] {L} Fix close button on popups (for right now removing them works as they're not necessary)
- [ ] {L} Erase phantom if the change is from the same line and ch 0
- [ ] {L} Run script as you type
- [ ] {L} Automatic walkthrough
- [ ] {L} An interface for viewing all expressions
- [ ] {L} (optimization) Stop concatenating phantom content together when the line length has reached 40-50 chars.
- [ ] {L} Change popup render to be recursive
- [ ] {L} Customize eslint and get rid of whack rules
- [ ] {L} Make lines after an error opaque, maybe even lines that haven't run ?
- [ ] {L} Better positioning for popups (make it closer to the mouse);
- [ ] {L} Move the keybindings to a command like system that uses contexts
- [x] {L} Error coverage points for all frames in the stack
- [x] {L} Don't show popups for after a modified line
- [x] {L} Put all tokens in a single array and distinguish each token by its type property

- [ ] {RL} Pass compilation data with $emit('transform-error')
- [ ] {RL} Custom keybindings





## Ideas

- Add popup number prefix as a setting, maybe as text you can enter like:
 ```
 $$): -> 1): <content>
 $ -> 0
 ```
