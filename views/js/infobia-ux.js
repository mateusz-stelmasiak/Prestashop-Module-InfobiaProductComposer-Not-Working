/**
 * Infobia Product Composer - front office helpers.
 *
 * A product built with this module can show thirty-odd tiles in one scroll.
 * Two things are missing from the stock interface, and this file adds those
 * and nothing else:
 *
 *   1. A search box, so a tile can be found without scrolling.
 *   2. A "3 / 7" count on each category - the same rule the module validates
 *      on add-to-cart - plus a note on a tile that has hit its own maximum.
 *      Without it the shopper only learns something is wrong from an alert
 *      after pressing the button.
 *
 * It layers on top of the existing markup and leaves prices, quantities and
 * cart submission to script_front.js. Without this file the module behaves
 * exactly as before.
 *
 * Styling inherits the theme's typography and surfaces rather than
 * introducing a second visual language.
 */
(function () {
    'use strict';

    var STRINGS = {
        searchLabel: 'Szukaj w składnikach',
        searchPlaceholder: 'Szukaj składnika…',
        clearSearch: 'Wyczyść',
        noResults: 'Brak pozycji pasujących do',
        showAll: 'Pokaż wszystkie',
        results: 'pasujące pozycje',
        capped: 'maks.'
    };

    var ROOT_ID = 'divInfobia';
    var CARD_SELECTOR = '.infobiaCheckbox, .divInfobiaRadio';
    var MIN_CARDS_FOR_SEARCH = 8;

    var state = { root: null, sections: [], cards: [], query: '', els: {} };

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

    /** Lowercase, strip accents, fold the Polish letters NFD leaves alone. */
    function normalize(value) {
        var text = String(value == null ? '' : value).toLowerCase();
        if (text.normalize) {
            text = text.normalize('NFD').replace(/[̀-ͯ]/g, '');
        }
        return text.replace(/ł/g, 'l').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /**
     * Polish is heavily inflected, so "zupa" must still find "Zupy".
     * Comparing on a crude stem covers the common endings without a stemmer.
     */
    function stem(word) {
        if (word.length >= 6) { return word.slice(0, word.length - 2); }
        if (word.length >= 4) { return word.slice(0, word.length - 1); }
        return word;
    }

    function matchesTerm(card, term) {
        if (card.haystack.indexOf(term) !== -1) { return true; }
        var root = stem(term);
        if (root.length < 3) { return false; }
        return card.words.some(function (word) { return word.indexOf(root) === 0; });
    }

    /* ---------------------------------------------------------------- *
     *  Reading the existing DOM
     * ---------------------------------------------------------------- */

    function readCard(el) {
        var input = el.querySelector('.inputInfobia') ||
            el.querySelector('input[type=checkbox], input[type=radio]');
        var titleEl = el.querySelector('.titreAttrib');
        var name = '';

        if (input && input.getAttribute('attrib_name')) {
            name = input.getAttribute('attrib_name');
        } else if (titleEl) {
            name = titleEl.textContent;
        }

        var stepper = el.querySelector('.plusminusDiv');

        return {
            el: el,
            input: input,
            qtyInput: el.querySelector('input.quantity') || el.querySelector('input[type=number]'),
            name: String(name || '').trim(),
            haystack: '',
            words: [],
            childrenEl: null,
            section: null,
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
            name: (labelEl.getAttribute('name_option') || labelEl.textContent || '').trim(),
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
                    card.section = sections[i];
                    sections[i].cards.push(card);
                    break;
                }
            }

            if (card.input) {
                var g = card.input.getAttribute('id_groupe');
                var o = card.input.getAttribute('id_opt');
                var a = card.input.getAttribute('id_att');
                if (g && o && a) {
                    card.childrenEl = document.getElementById('Children_' + g + '_' + o + '_' + a);
                }
            }

            card.haystack = normalize(card.name + ' ' + (card.section ? card.section.name : ''));
            card.words = card.haystack ? card.haystack.split(' ') : [];
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
     *  Search
     * ---------------------------------------------------------------- */

    function buildSearch() {
        var bar = makeEl('div', 'ipc-bar');
        var field = makeEl('div', 'ipc-search');

        var input = makeEl('input', 'ipc-search__input');
        input.type = 'search';
        input.placeholder = STRINGS.searchPlaceholder;
        input.setAttribute('aria-label', STRINGS.searchLabel);
        input.autocomplete = 'off';

        var clear = makeEl('button', 'ipc-search__clear', '×');
        clear.type = 'button';
        clear.setAttribute('aria-label', STRINGS.clearSearch);

        field.appendChild(makeEl('span', 'ipc-search__icon'));
        field.appendChild(input);
        field.appendChild(clear);
        bar.appendChild(field);

        var status = makeEl('p', 'ipc-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        bar.appendChild(status);

        state.els.bar = bar;
        state.els.search = input;
        state.els.clearSearch = clear;
        state.els.status = status;

        return bar;
    }

    function applyFilter() {
        var query = normalize(state.query);
        var terms = query ? query.split(' ') : [];
        var visible = 0;

        state.cards.forEach(function (card) {
            var matches = !terms.length || terms.every(function (term) {
                return matchesTerm(card, term);
            });

            card.el.classList.toggle('ipc-hidden', !matches);
            if (card.childrenEl) {
                card.childrenEl.classList.toggle('ipc-hidden', !matches);
            }
            if (matches) { visible++; }
        });

        state.sections.forEach(function (section) {
            if (!section.cards.length) { return; }
            var any = section.cards.some(function (card) {
                return !card.el.classList.contains('ipc-hidden');
            });
            section.el.classList.toggle('ipc-hidden', !any);
        });

        toArray(state.root.querySelectorAll('.groupInfobia')).forEach(function (group) {
            var any = toArray(group.querySelectorAll('.divOptionInfobia')).some(function (el) {
                return !el.classList.contains('ipc-hidden');
            });
            group.classList.toggle('ipc-hidden', !any);
        });

        renderStatus(visible);
    }

    function renderStatus(visible) {
        var status = state.els.status;
        if (!status) { return; }

        status.innerHTML = '';

        if (!state.query) {
            status.classList.remove('ipc-status--active');
            return;
        }

        status.classList.add('ipc-status--active');
        status.appendChild(document.createTextNode(
            visible === 0
                ? STRINGS.noResults + ' „' + state.query + '”. '
                : visible + ' ' + STRINGS.results + '. '
        ));

        var reset = makeEl('button', 'ipc-link', STRINGS.showAll);
        reset.type = 'button';
        reset.addEventListener('click', resetSearch);
        status.appendChild(reset);
    }

    function resetSearch() {
        state.query = '';
        if (state.els.search) { state.els.search.value = ''; }
        applyFilter();
    }

    /* ---------------------------------------------------------------- *
     *  Category count and per-tile ceiling
     * ---------------------------------------------------------------- */

    function buildBadges() {
        state.sections.forEach(function (section) {
            if (!section.counts || !section.cards.length) { return; }
            section.badgeEl = makeEl('span', 'ipc-badge');
            section.labelEl.appendChild(section.badgeEl);
        });
    }

    /**
     * Shows "maks. 5" beside a tile at its ceiling, so it is clear why "+"
     * stopped responding. Where the template already prints the limit, that
     * element is emphasised instead of adding a second one.
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

            var picked = section.cards.reduce(function (sum, card) {
                return sum + cardQty(card);
            }, 0);

            var status = 'under';
            if (section.max && picked > section.max) {
                status = 'over';
            } else if (picked >= section.min && (!section.max || picked <= section.max)) {
                status = (picked > 0 || section.min === 0) ? 'ok' : 'under';
            }

            section.badgeEl.textContent = section.max
                ? picked + ' / ' + section.max
                : String(picked);
            section.badgeEl.className = 'ipc-badge ipc-badge--' + status;
        });
    }

    /* ---------------------------------------------------------------- *
     *  Wiring
     * ---------------------------------------------------------------- */

    function bind() {
        if (state.els.search) {
            var timer = null;
            state.els.search.addEventListener('input', function () {
                state.query = this.value;
                clearTimeout(timer);
                timer = setTimeout(applyFilter, 120);
            });
            state.els.search.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') { resetSearch(); }
            });
            state.els.clearSearch.addEventListener('click', resetSearch);
        }

        // Quantities are changed by the module's own jQuery handlers, which do
        // not emit native events. Every such change still comes from a user
        // gesture inside the composer, so re-read state just after one.
        ['click', 'change', 'input', 'keyup'].forEach(function (type) {
            state.root.addEventListener(type, function (event) {
                if (closest(event.target, '.ipc-bar')) { return; }
                window.requestAnimationFrame(refresh);
                setTimeout(refresh, 180);
            });
        });
    }

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

        if (collected.cards.length >= MIN_CARDS_FOR_SEARCH) {
            root.insertBefore(buildSearch(), root.firstChild);
        }

        buildBadges();
        bind();
        refresh();
    }

    ready(init);
}());
