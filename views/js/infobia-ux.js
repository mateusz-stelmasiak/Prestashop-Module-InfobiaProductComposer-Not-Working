/**
 * Infobia Product Composer - front office helpers.
 *
 * The stock interface lets a shopper fill a category past its limit, or leave
 * it short, and only says so in an alert after they press add-to-cart. This
 * adds the two signals that were missing and nothing else:
 *
 *   1. A "3 / 7" count beside each category heading, using the same rule the
 *      module validates on submit.
 *   2. A note on a tile that has reached its own maximum, so it is clear why
 *      "+" stopped responding.
 *
 * It reads the existing markup and leaves prices, quantities and cart
 * submission to script_front.js. Without this file the module behaves exactly
 * as before.
 */
(function () {
    'use strict';

    var STRINGS = {
        capped: 'maks.'
    };

    var ROOT_ID = 'divInfobia';
    var CARD_SELECTOR = '.infobiaCheckbox, .divInfobiaRadio';

    var state = { root: null, sections: [], cards: [] };

    /* ---------------------------------------------------------------- *
     *  Helpers
     * ---------------------------------------------------------------- */

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function toArray(list) {
        return Array.prototype.slice.call(list || []);
    }

    function makeEl(tag, className, text) {
        var el = document.createElement(tag);
        if (className) { el.className = className; }
        if (text != null) { el.textContent = text; }
        return el;
    }

    function toInt(value, fallback) {
        var n = parseInt(value, 10);
        return isNaN(n) ? (fallback || 0) : n;
    }

    function closest(el, selector) {
        if (el && el.closest) { return el.closest(selector); }
        while (el && el.nodeType === 1) {
            if (el.matches && el.matches(selector)) { return el; }
            el = el.parentElement;
        }
        return null;
    }

    /* ---------------------------------------------------------------- *
     *  Reading the existing DOM
     * ---------------------------------------------------------------- */

    function readCard(el) {
        var stepper = el.querySelector('.plusminusDiv');

        return {
            el: el,
            input: el.querySelector('.inputInfobia') ||
                el.querySelector('input[type=checkbox], input[type=radio]'),
            qtyInput: el.querySelector('input.quantity') || el.querySelector('input[type=number]'),
            maxQty: stepper ? toInt(stepper.getAttribute('max_attr'), 0) : 0,
            templateCapEl: el.querySelector('.max-quantity-text'),
            capEl: null
        };
    }

    function readSection(labelEl) {
        var container = closest(labelEl, '.divOptionInfobia');
        if (!container) { return null; }

        var type = labelEl.getAttribute('type_option') || '';

        return {
            el: container,
            labelEl: labelEl,
            counts: (type === 'checkbox' || type === 'checkbox_img'),
            min: toInt(labelEl.getAttribute('min_attr_option'), 0),
            max: toInt(labelEl.getAttribute('max_attr_option'), 0),
            cards: [],
            badgeEl: null
        };
    }

    function collect(root) {
        var sections = [];

        toArray(root.querySelectorAll('label.titleOption')).forEach(function (labelEl) {
            var section = readSection(labelEl);
            if (section) { sections.push(section); }
        });

        var cards = toArray(root.querySelectorAll(CARD_SELECTOR)).map(readCard);

        cards.forEach(function (card) {
            var container = closest(card.el, '.divOptionInfobia');

            // Sub-question tiles sit in a `.children` block that is a sibling
            // of the category they belong to.
            if (!container) {
                var childrenBlock = closest(card.el, '.children');
                if (childrenBlock) {
                    var sibling = childrenBlock.previousElementSibling;
                    while (sibling && !(sibling.matches && sibling.matches('.divOptionInfobia'))) {
                        sibling = sibling.previousElementSibling;
                    }
                    container = sibling;
                }
            }

            for (var i = 0; i < sections.length; i++) {
                if (sections[i].el === container) {
                    sections[i].cards.push(card);
                    break;
                }
            }
        });

        return { sections: sections, cards: cards };
    }

    /** Mirrors what the module counts on submit. */
    function cardQty(card) {
        if (!card.input || !card.input.checked) { return 0; }
        if (!card.qtyInput) { return 1; }
        return Math.max(toInt(card.qtyInput.value, 0), 0);
    }

    /* ---------------------------------------------------------------- *
     *  Rendering
     * ---------------------------------------------------------------- */

    function buildBadges() {
        state.sections.forEach(function (section) {
            if (!section.counts || !section.cards.length) { return; }
            section.badgeEl = makeEl('span', 'ipc-badge');
            section.labelEl.appendChild(section.badgeEl);
        });
    }

    function renderBadge(section, picked) {
        var status = 'under';
        if (section.max && picked > section.max) {
            status = 'over';
        } else if (picked >= section.min && (!section.max || picked <= section.max)) {
            status = (picked > 0 || section.min === 0) ? 'ok' : 'under';
        }

        var badge = section.badgeEl;
        badge.className = 'ipc-badge ipc-badge--' + status;
        badge.innerHTML = '';
        badge.appendChild(makeEl('span', 'ipc-badge__n', String(picked)));

        if (section.max) {
            badge.appendChild(document.createTextNode(' / ' + section.max));
        }
    }

    /**
     * Shows "maks. 5" beside a tile at its ceiling. Where the template already
     * prints the limit, that element is emphasised rather than adding a second.
     */
    function updateCap(card, qty) {
        var capped = card.maxQty > 0 && qty >= card.maxQty;

        if (card.templateCapEl) {
            card.templateCapEl.classList.toggle('ipc-cap-hit', capped);
            return;
        }

        if (capped && !card.capEl) {
            card.capEl = makeEl('span', 'ipc-cap', STRINGS.capped + ' ' + card.maxQty);
            var anchor = card.el.querySelector('.plusminusDiv');
            if (anchor && anchor.parentNode) {
                anchor.parentNode.insertBefore(card.capEl, anchor.nextSibling);
            } else {
                card.el.appendChild(card.capEl);
            }
        }
        if (card.capEl) {
            card.capEl.classList.toggle('ipc-hidden', !capped);
        }
    }

    function refresh() {
        state.cards.forEach(function (card) {
            var qty = cardQty(card);
            card.el.classList.toggle('ipc-selected', qty > 0);
            updateCap(card, qty);
        });

        state.sections.forEach(function (section) {
            if (!section.badgeEl) { return; }
            renderBadge(section, section.cards.reduce(function (sum, card) {
                return sum + cardQty(card);
            }, 0));
        });
    }

    /* ---------------------------------------------------------------- *
     *  Wiring
     * ---------------------------------------------------------------- */

    function init() {
        var root = document.getElementById(ROOT_ID);
        if (!root || root.hasAttribute('data-ipc-enhanced')) { return; }

        var collected = collect(root);
        if (!collected.cards.length) { return; }

        root.setAttribute('data-ipc-enhanced', '1');
        root.classList.add('ipc-root');

        state.root = root;
        state.sections = collected.sections;
        state.cards = collected.cards;

        buildBadges();

        // Quantities are changed by the module's own jQuery handlers, which do
        // not emit native events. Every such change still comes from a user
        // gesture inside the composer, so re-read state just after one.
        ['click', 'change', 'input', 'keyup'].forEach(function (type) {
            root.addEventListener(type, function () {
                window.requestAnimationFrame(refresh);
                setTimeout(refresh, 180);
            });
        });

        refresh();
    }

    ready(init);
}());
