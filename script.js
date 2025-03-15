import {A,E,O,Q} from '../AEOQ.mjs';
import PointerInteraction from '../pointer-interaction/script.js';

CSS.registerProperty({
    name: "--angle",
    syntax: "<angle>",
    inherits: true,
    initialValue: "0deg",
});
class Knob extends HTMLElement {
    #internals; #output; #θ; #fine;
    constructor(props) {
        super();
        this.#internals = this.attachInternals();
        this.attachShadow({mode: 'open'}).append(
            this.#output = E('output', {part: 'output'}),
            E('link', {rel: 'stylesheet', href: `https://aeoq.github.io/drag-knob/style.css`}),
            E('slot'), 
	    );
        Object.assign(this, props ?? {});
        Object.assign(this.set, this.#set);
    }
    get = attr => (typeof this[attr] == 'function' ? null : this[attr]) ?? (v => isNaN(parseFloat(v)) ? v : parseFloat(v))(this.getAttribute(attr));
    set = (attr, value) => this.setAttribute(attr, value);
    #set = {
        value: ({v, θ}) => {
            if (θ != null) {
                v = this.snap?.(this.θ.to.v(θ)) ?? this.θ.to.v(θ);
            } else {
                v ??= this.get('value');
                this.set.angle({v: this.snap?.(v) ?? v});
            }
            this.#internals.setFormValue(this.value = v);
            this.#output.value = v + (this.get('unit') || '');
            this.dispatchEvent(new InputEvent('input', {bubbles: true}));
        },
        angle: ({v, PI}) => {
            if (v != null) {
                this.classList.add('animate');
                this.#θ = this.v.to.θ(v);
            } else {
                this.#θ = PI.$drag.θ = Math.max(this.minθ, Math.min(PI.$press.θ - PI.$drag.dy / (this.#fine ? 10 : 1), this.maxθ));
                (PI.$drag.θ == this.minθ || PI.$drag.θ == this.maxθ) && ([PI.$press.y, PI.$press.θ] = [PI.$drag.y, PI.$drag.θ]);
                this.set.value({θ: this.#θ});
            }
            E(this).set({'--angle': `${this.#θ}deg`});
            setTimeout(() => this.classList.remove('animate'), 500);
        }
    }
    connectedCallback() {
        this.setup();
        PointerInteraction.events([[this, {
            click: click => click.for(2).to(() => this.dblclick?.()).chain(this.click.toString().includes('native') ? null : this.click),
            press: PI => {
                PI.$press.θ = this.#θ;
                this.#fine = this.matches('.fine');
                this.press?.(PI);
            },
            drag: PI => {
                Math.abs(PI.$drag.dy) >= 1 && this.set.angle({PI});
                this.drag?.(PI);
            },
            lift: PI => {
                (this.get('step') || this.get('list')) && this.set.angle({v: this.value});
                this.lift?.(PI);
            }
        }]]);
	}
    setup() {
	    this.name = this.get('name');
    }
    attributeChangedCallback(_, __, v) {
        setTimeout(() => this.set.value({v}));
    }
    static observedAttributes = ['value'];
    static formAssociated = true;
}
let CKnob, DKnob;
customElements.define('continuous-knob', CKnob = class extends Knob {
    constructor(props) {
	    super(props);
    }
    connectedCallback() {
        super.connectedCallback();
        this.attributeChangedCallback(null, null, this.get('value') ?? this.minV); 
    }
    setup() {
        this.minθ ??= 35;
        this.maxθ ??= 360 - this.minθ;
        this.minV = this.get('min') || 0;
        this.maxV = this.get('max') || 100;
        this.minV == this.maxV * -1 && this.classList.add('symmetric');
        this.step = this.get('step') || 0.01;
        E(this).set({'--min': `${this.minθ}deg`});
        super.setup();
    }
    θ = {
        to: {v: θ => (θ - this.minθ) / (this.maxθ - this.minθ) * (this.maxV - this.minV) + this.minV}
    }
    v = {
        to: {θ: v => (v - this.minV) / (this.maxV - this.minV) * (this.maxθ - this.minθ) + this.minθ}
    }
    snap = v => parseFloat((Math.round(v / this.step) * this.step).toFixed(`${this.step}`.split('.')[1]?.length ?? 0))
    dblclick() {
        let snap = this.get('snap');
        this.set.value({v: snap ? Math.round(this.value / snap) * snap : 0});
    }
});
customElements.define('discrete-knob', DKnob = class extends Knob {
    constructor(props) {
	    super(props);
    }
    connectedCallback() {
        super.connectedCallback();
        this.attributeChangedCallback(null, null, this.get('value') ?? this.list[0]); 
    }
    setup() {
        this.minθ ??= 90;
        this.maxθ ??= 360 - this.minθ;
        this.list = JSON.parse(this.get('list'));
        let gradient = this.list.map(this.v.to.θ).map(θ => `${θ-2}deg, var(--light) ${θ-2}deg ${θ+2}deg, transparent ${θ+2}deg `).join('');
        E(this.sQ('link')).set({'--gradient': `conic-gradient(transparent ${gradient})`});
        super.setup();
    }
    θ = {
        to: {v: θ => this.list[Math.round((θ - this.minθ) / (this.maxθ - this.minθ) * (this.list.length - 1))]}
    }
    v = {
        to: {θ: v => this.list.indexOf(v) / (this.list.length - 1) * (this.maxθ - this.minθ) + this.minθ}
    }
});
export {CKnob, DKnob};
