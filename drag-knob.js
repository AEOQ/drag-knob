import {A,E,O,Q} from '../AEOQ.mjs';
import {Dragging, DoubleTapping} from '../drag.mjs';

window.CSS.registerProperty({
    name: "--angle",
    syntax: "<angle>",
    inherits: true,
    initialValue: "0deg",
});
customElements.define('continuous-knob', class extends HTMLElement {
    #internals; #output; #θ;
	constructor(props) {
		super();
		this.#internals = this.attachInternals();
		this.attachShadow({mode: 'open'}).append(
            this.#output = E('output', {part: 'output'}),
            E('link', {rel: 'stylesheet', href: `https://aeoq.github.io/drag-knob/drag-knob.css`}),
            E('slot'), 
        );
        Object.assign(this, props ?? {});
        this.setup();
	}
    get = attr => (v => isNaN(parseFloat(v)) ? v : parseFloat(v))(this.getAttribute(attr));
    set = {
        value: ({v, θ}) => {
            if (θ != null) {
                v = this.snap((θ - this.minθ) / (this.maxθ - this.minθ) * (this.maxV - this.minV) + this.minV);
            } else {
                this.set.angle({v: this.snap(v ??= this.get('value'))});
            }
            this.#internals.setFormValue(this.value = v);
            this.#output.value = v + (this.get('unit') || '');
            this.dispatchEvent(new InputEvent('input', {bubbles: true}));
        },
        angle: ({v, drag}) => {
            if (v != null) {
                this.classList.add('animate');
                this.#θ = (v - this.minV) / (this.maxV - this.minV) * (this.maxθ - this.minθ) + this.minθ;
            } else {
                this.matches('.fine') && (drag.deltaY /= 10);
                this.#θ = drag.moveθ = Math.max(this.minθ, Math.min(drag.pressθ - drag.deltaY, this.maxθ));
                (drag.moveθ == this.minθ || drag.moveθ == this.maxθ) && ([drag.pressY, drag.pressθ] = [drag.moveY, drag.moveθ]);
                this.set.value({θ: this.#θ});
            }
            E(this).set({'--angle': `${this.#θ}deg`});
            setTimeout(() => this.classList.remove('animate'), 500);
        }
    }
    snap = v => parseFloat((Math.round(v / this.step) * this.step).toFixed(`${this.step}`.split('.')[1]?.length ?? 0))
	connectedCallback() {
        this.get('value') || this.attributeChangedCallback(null, null, this.minV); 
        new Dragging(this, {
            translate: false,
            press: drag => drag.pressθ = this.#θ,
            move: drag => Math.abs(drag.deltaY) >= 1 && this.set.angle({drag}),
            lift: () => this.get('step') && this.set.angle({v: this.value})
        });
	}
    setup() {
        this.minθ ??= 35;
        this.maxθ ??= 360 - this.minθ;
        this.minV = this.get('min') || 0, this.maxV = this.get('max') || 100;
        this.minV == this.maxV * -1 && this.classList.add('symmetric');
        this.step = this.get('step') || 0.01;
        E(this).set({'--min': `${this.minθ}deg`});
        this.events();
    }
    events() {
        let snap = this.get('snap');
        this.ondblclick = ev => {
            ev.preventDefault();
            this.set.value({v: snap ? Math.round(this.value / snap) * snap : 0});
        }
        /iPad|iPhone/.test(navigator.userAgent) && (this.ontouchend = ev => DoubleTapping(ev, this));
    }
    attributeChangedCallback(_, __, v) {
        this.set.value({v});
    }
    static observedAttributes = ['value'];
    static formAssociated = true;
});