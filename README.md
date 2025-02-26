Drag to knobs up or down to spin them.

Add the class ```fine``` to any knob such that it only spins at 1/10 of original speed. 
```html
<script src="https://aeoq.github.io/drag-knob/drag-knob.js" type="module"></script>
<continuous-knob name="knob-1" min="0" max="100" value="43" step="0.5" snap="25" unit="%" style="--light:lime;"></continuous-knob>
```
```snap``` automatically adjusts the knob to nearest value provided when double clicked / tapped.

Defaults are: min=0, max=100, step=0.01.

To style the ```output``` element inside, use
```css
continuous-knob::part(output) {
    ...
}
```
To customize the center part of the knob, use
```css
continuous-knob::part(output)::after {
    background:...;
}
```