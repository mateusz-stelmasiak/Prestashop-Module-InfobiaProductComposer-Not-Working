/**
 * Infobia Product Composer - front office usability layer.
 *
 * Products built with this module can show several dozen option tiles in one
 * long scroll. The stock interface gives no way to find a tile, no running
 * indication of how many items a category still needs, and no summary of what
 * has been picked - the shopper only finds out something is wrong when the
 * add-to-cart validation pops an alert.
 *
 * This file adds, on top of the existing markup:
 *
 *   - a search box that filters tiles as you type (diacritic-insensitive),
 *   - a live "3 / 7" progress badge per category, matching the same rule the
 *     module validates on submit,
 *   - a summary of everything currently selected, with click-to-scroll,
 *   - "show only selected" and "clear selection" shortcuts,
 *   - a clear selected state on the tiles themselves.
 *
 * It deliberately does not touch prices, quantities or cart submission: those
 * stay owned by script_front.js. Nothing here is required for the composer to
 * work - if this file is absent the module behaves exactly as before.
 */
(function () {
    'use strict';

    var STRINGS = {
        searchLabel: 'Szukaj w składnikach',
        searchPlaceholder: 'Szukaj np. „barszcz”, „gulasz”…',
        clearSearch: 'Wyczyść wyszukiwanie',
        onlySelected: 'Tylko wybrane',
        clearAll: 'Wyczyść wybór',
        summaryEmpty: 'Nie wybrano jeszcze żadnych pozycji.',
        summaryTitle: 'Twój wybór',
        noResults: 'Brak pozycji pasujących do',
        showAll: 'Pokaż wszystkie',
        hiddenSelected: 'wybrane pozycje są ukryte przez filtr',
        jumpTo: 'Przejdź do:',
        of: 'z',
        selectedCount: 'wybrano',
        remaining: 'brakuje',
        tooMany: 'za dużo o',
        complete: 'komplet',
        results: 'pasujące pozycje',
        confirmClear: 'Wyczyścić wszystkie wybrane pozycje?'
    };

    var ROOT_ID = 'divInfobia';
    var CARD_SELECTOR = '.infobiaCheckbox, .divInfobiaRadio';
    var MIN_CARDS_FOR_SEARCH = 8;

    var state = {
        root: null,
        sections: [],
        cards: [],
        query: '',
        onlySelected: false,
        els: {}
    };

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

    function toArray(nodeList) {
        return Array.prototype.slice.call(nodeList || []);
    }

    /** Lowercase, strip accents, and fold the Polish letters NFD leaves alone. */
    function normalize(value) {
        var text = String(value == null ? '' : value).toLowerCase();

        if (text.normalize) {
            text = text.normalize('NFD').replace(/[̀-ͯ]/g, '');
        }

        return text
            .replace(/ł/g, 'l')
            .replace(/[^a-z0-9 ]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Polish is heavily inflected, so a shopper typing "zupa" must still find
     * the "Zupy" category. Comparing on a crude stem rather than the literal
     * word covers the common endings without pulling in a stemmer library.
     */
    function stem(word) {
        if (word.length >= 6) {
            return word.slice(0, word.length - 2);
        }
        if (word.length >= 4) {
            return word.slice(0, word.length - 1);
        }
        return word;
    }

    function matchesTerm(card, term) {
        if (card.haystack.indexOf(term) !== -1) {
            return true;
        }

        var root = stem(term);
        if (root.length < 3) {
            return false;
        }

        return card.words.some(function (word) {
            return word.indexOf(root) === 0;
        });
    }

    function closest(el, selector) {
        if (el && el.closest) {
            return el.closest(selector);
        }
        while (el && el.nodeType === 1) {
            if (el.matches && el.matches(selector)) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function makeEl(tag, className, text) {
        var el = document.createElement(tag);
        if (className) {
            el.className = className;
        }
        if (text != null) {
            el.textContent = text;
        }
        return el;
    }

    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? (fallback || 0) : parsed;
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

        var card = {
            el: el,
            input: input,
            qtyInput: el.querySelector('input.quantity') || el.querySelector('input[type=number]'),
            name: String(name || '').trim(),
            haystack: '',
            words: [],
            childrenEl: null,
            section: null
        };

        // The block of sub-questions this tile reveals when selected, so a
        // filtered-out tile does not leave an orphan sub-question behind.
        if (input) {
            var idGroup = input.getAttribute('id_groupe');
            var idOption = input.getAttribute('id_opt');
            var idAttribute = input.getAttribute('id_att');
            if (idGroup && idOption && idAttribute) {
                card.childrenEl = document.getElementById(
                    'Children_' + idGroup + '_' + idOption + '_' + idAttribute
                );
            }
        }

        return card;
    }

    function readSection(labelEl) {
        var container = closest(labelEl, '.divOptionInfobia');
        if (!container) {
            return null;
        }

        var type = labelEl.getAttribute('type_option') || '';

        return {
            el: container,
            labelEl: labelEl,
            name: (labelEl.getAttribute('name_option') || labelEl.textContent || '').trim(),
            type: type,
            counts: (type === 'checkbox' || type === 'checkbox_img'),
            min: toInt(labelEl.getAttribute('min_attr_option'), 0),
            max: toInt(labelEl.getAttribute('max_attr_option'), 0),
            cards: [],
            badgeEl: null,
            navEl: null
        };
    }

    function collect(root) {
        var sections = [];
        var byContainer = [];

        toArray(root.querySelectorAll('label.titleOption')).forEach(function (labelEl) {
            var section = readSection(labelEl);
            if (section) {
                sections.push(section);
                byContainer.push(section);
            }
        });

        var cards = toArray(root.querySelectorAll(CARD_SELECTOR)).map(readCard);

        cards.forEach(function (card) {
            var container = closest(card.el, '.divOptionInfobia');

            // Sub-question tiles live in a `.children` block that is a sibling
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

            for (var i = 0; i < byContainer.length; i++) {
                if (byContainer[i].el === container) {
                    card.section = byContainer[i];
                    byContainer[i].cards.push(card);
                    break;
                }
            }

            card.haystack = normalize(
                card.name + ' ' + (card.section ? card.section.name : '')
            );
            card.words = card.haystack ? card.haystack.split(' ') : [];
        });

        return { sections: sections, cards: cards };
    }

    /* ---------------------------------------------------------------- *
     *  Selection state - mirrors what the module validates on submit
     * ---------------------------------------------------------------- */

    function cardQty(card) {
        if (!card.input || !card.input.checked) {
            return 0;
        }
        if (!card.qtyInput) {
            return 1;
        }

        return Math.max(toInt(card.qtyInput.value, 0), 0);
    }

    function isSelected(card) {
        return cardQty(card) > 0;
    }

    /* ---------------------------------------------------------------- *
     *  Building the toolbar
     * ---------------------------------------------------------------- */

    function buildToolbar(showSearch) {
        var bar = makeEl('div', 'ipc-bar');
        var row = makeEl('div', 'ipc-bar__row');

        if (showSearch) {
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
            row.appendChild(field);

            state.els.search = input;
            state.els.clearSearch = clear;
        }

        var actions = makeEl('div', 'ipc-bar__actions');

        var onlyBtn = makeEl('button', 'ipc-toggle', STRINGS.onlySelected);
        onlyBtn.type = 'button';
        onlyBtn.setAttribute('aria-pressed', 'false');

        var clearAllBtn = makeEl('button', 'ipc-ghost', STRINGS.clearAll);
        clearAllBtn.type = 'button';

        actions.appendChild(onlyBtn);
        actions.appendChild(clearAllBtn);
        row.appendChild(actions);
        bar.appendChild(row);

        var nav = makeEl('div', 'ipc-nav');
        bar.appendChild(nav);

        var summary = makeEl('div', 'ipc-summary');
        var summaryHead = makeEl('div', 'ipc-summary__head');
        summaryHead.appendChild(makeEl('span', 'ipc-summary__title', STRINGS.summaryTitle));
        summaryHead.appendChild(makeEl('span', 'ipc-summary__total'));
        var summaryList = makeEl('div', 'ipc-summary__list');
        summary.appendChild(summaryHead);
        summary.appendChild(summaryList);
        bar.appendChild(summary);

        var status = makeEl('p', 'ipc-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        bar.appendChild(status);

        state.els.bar = bar;
        state.els.nav = nav;
        state.els.onlyBtn = onlyBtn;
        state.els.clearAllBtn = clearAllBtn;
        state.els.summary = summary;
        state.els.summaryList = summaryList;
        state.els.summaryTotal = summaryHead.querySelector('.ipc-summary__total');
        state.els.status = status;

        return bar;
    }

    function buildNav() {
        var nav = state.els.nav;
        if (!nav) {
            return;
        }

        var countable = state.sections.filter(function (section) {
            return section.name && section.cards.length;
        });

        if (countable.length < 2) {
            nav.style.display = 'none';
            return;
        }

        nav.appendChild(makeEl('span', 'ipc-nav__label', STRINGS.jumpTo));

        countable.forEach(function (section) {
            var chip = makeEl('button', 'ipc-chip');
            chip.type = 'button';
            chip.appendChild(makeEl('span', 'ipc-chip__name', section.name));
            var count = makeEl('span', 'ipc-chip__count');
            chip.appendChild(count);

            chip.addEventListener('click', function () {
                scrollToEl(section.el);
            });

            section.navEl = chip;
            section.navCountEl = count;
            nav.appendChild(chip);
        });
    }

    function buildBadges() {
        state.sections.forEach(function (section) {
            if (!section.counts || !section.cards.length) {
                return;
            }

            var badge = makeEl('span', 'ipc-badge');
            section.labelEl.appendChild(badge);
            section.badgeEl = badge;
        });
    }

    function scrollToEl(el) {
        if (!el) {
            return;
        }

        var bar = state.els.bar;
        var offset = bar ? bar.getBoundingClientRect().height + 12 : 0;
        var top = window.pageYOffset + el.getBoundingClientRect().top - offset;

        try {
            window.scrollTo({ top: top, behavior: 'smooth' });
        } catch (e) {
            window.scrollTo(0, top);
        }
    }

    /* ---------------------------------------------------------------- *
     *  Rendering
     * ---------------------------------------------------------------- */

    function applyFilter() {
        var query = normalize(state.query);
        var terms = query ? query.split(' ') : [];
        var visible = 0;
        var hiddenSelected = 0;

        state.cards.forEach(function (card) {
            var matches = true;

            if (terms.length) {
                matches = terms.every(function (term) {
                    return matchesTerm(card, term);
                });
            }

            if (matches && state.onlySelected && !isSelected(card)) {
                matches = false;
            }

            card.el.classList.toggle('ipc-hidden', !matches);
            if (card.childrenEl) {
                card.childrenEl.classList.toggle('ipc-hidden', !matches);
            }

            if (matches) {
                visible++;
            } else if (isSelected(card)) {
                hiddenSelected++;
            }
        });

        // Collapse categories that have nothing left to show.
        state.sections.forEach(function (section) {
            if (!section.cards.length) {
                return;
            }
            var anyVisible = section.cards.some(function (card) {
                return !card.el.classList.contains('ipc-hidden');
            });
            section.el.classList.toggle('ipc-hidden', !anyVisible);
            if (section.navEl) {
                section.navEl.classList.toggle('ipc-chip--dimmed', !anyVisible);
            }
        });

        toArray(state.root.querySelectorAll('.groupInfobia')).forEach(function (group) {
            var anyVisible = toArray(group.querySelectorAll('.divOptionInfobia')).some(function (el) {
                return !el.classList.contains('ipc-hidden');
            });
            group.classList.toggle('ipc-hidden', !anyVisible);
        });

        renderStatus(visible, hiddenSelected);
    }

    function renderStatus(visible, hiddenSelected) {
        var status = state.els.status;
        if (!status) {
            return;
        }

        var filtering = state.query || state.onlySelected;
        status.innerHTML = '';

        if (!filtering) {
            status.classList.remove('ipc-status--active');
            return;
        }

        status.classList.add('ipc-status--active');

        if (visible === 0) {
            status.appendChild(document.createTextNode(
                STRINGS.noResults + ' „' + state.query + '”. '
            ));
        } else {
            status.appendChild(document.createTextNode(
                visible + ' ' + STRINGS.results + '. '
            ));
        }

        if (hiddenSelected > 0) {
            status.appendChild(document.createTextNode(
                '(' + hiddenSelected + ' ' + STRINGS.hiddenSelected + '.) '
            ));
        }

        var reset = makeEl('button', 'ipc-link', STRINGS.showAll);
        reset.type = 'button';
        reset.addEventListener('click', resetFilters);
        status.appendChild(reset);
    }

    function resetFilters() {
        state.query = '';
        state.onlySelected = false;
        if (state.els.search) {
            state.els.search.value = '';
        }
        if (state.els.onlyBtn) {
            state.els.onlyBtn.classList.remove('is-active');
            state.els.onlyBtn.setAttribute('aria-pressed', 'false');
        }
        applyFilter();
    }

    function renderSelection() {
        var total = 0;
        var chips = [];

        state.cards.forEach(function (card) {
            var qty = cardQty(card);
            card.el.classList.toggle('ipc-selected', qty > 0);

            if (qty > 0) {
                total += qty;
                chips.push({ card: card, qty: qty });
            }
        });

        state.sections.forEach(function (section) {
            if (!section.counts) {
                return;
            }

            var picked = section.cards.reduce(function (sum, card) {
                return sum + cardQty(card);
            }, 0);

            var status = 'under';
            if (section.max && picked > section.max) {
                status = 'over';
            } else if (picked >= section.min && (!section.max || picked <= section.max)) {
                status = picked > 0 || section.min === 0 ? 'ok' : 'under';
            }

            if (section.badgeEl) {
                section.badgeEl.textContent = section.max
                    ? picked + ' / ' + section.max
                    : String(picked);
                section.badgeEl.className = 'ipc-badge ipc-badge--' + status;
                section.badgeEl.title = badgeHint(section, picked, status);
            }

            if (section.navCountEl) {
                section.navCountEl.textContent = section.max
                    ? picked + '/' + section.max
                    : String(picked);
                section.navEl.classList.toggle('ipc-chip--done', status === 'ok' && picked > 0);
                section.navEl.classList.toggle('ipc-chip--over', status === 'over');
            }
        });

        renderSummary(chips, total);
    }

    function badgeHint(section, picked, status) {
        if (status === 'over') {
            return STRINGS.tooMany + ' ' + (picked - section.max);
        }
        if (picked < section.min) {
            return STRINGS.remaining + ' ' + (section.min - picked);
        }
        return STRINGS.complete;
    }

    function renderSummary(chips, total) {
        var list = state.els.summaryList;
        if (!list) {
            return;
        }

        list.innerHTML = '';
        state.els.summaryTotal.textContent = total > 0 ? String(total) : '';
        state.els.summary.classList.toggle('is-empty', total === 0);

        if (total === 0) {
            list.appendChild(makeEl('span', 'ipc-summary__empty', STRINGS.summaryEmpty));
            return;
        }

        chips.forEach(function (entry) {
            var chip = makeEl('button', 'ipc-pill');
            chip.type = 'button';
            chip.appendChild(makeEl('span', 'ipc-pill__qty', '×' + entry.qty));
            chip.appendChild(makeEl('span', 'ipc-pill__name', entry.card.name));
            chip.title = entry.card.name;
            chip.addEventListener('click', function () {
                if (entry.card.el.classList.contains('ipc-hidden')) {
                    resetFilters();
                }
                scrollToEl(entry.card.el);
                entry.card.el.classList.add('ipc-flash');
                setTimeout(function () {
                    entry.card.el.classList.remove('ipc-flash');
                }, 1200);
            });
            list.appendChild(chip);
        });
    }

    function refresh() {
        renderSelection();
        if (state.onlySelected) {
            applyFilter();
        }
    }

    /* ---------------------------------------------------------------- *
     *  Wiring
     * ---------------------------------------------------------------- */

    function clearSelection() {
        if (!window.confirm(STRINGS.confirmClear)) {
            return;
        }

        state.cards.forEach(function (card) {
            if (card.qtyInput && toInt(card.qtyInput.value, 0) !== 0) {
                card.qtyInput.value = 0;
            }
            if (card.input && card.input.checked && card.input.type === 'checkbox') {
                card.input.checked = false;
                dispatch(card.input, 'change');
            }
        });

        refresh();
    }

    /** Fires an event the module's jQuery handlers will also see. */
    function dispatch(el, type) {
        var event;
        try {
            event = new Event(type, { bubbles: true });
        } catch (e) {
            event = document.createEvent('Event');
            event.initEvent(type, true, true);
        }
        el.dispatchEvent(event);
    }

    function bind() {
        if (state.els.search) {
            var timer = null;
            state.els.search.addEventListener('input', function () {
                state.query = this.value;
                clearTimeout(timer);
                timer = setTimeout(applyFilter, 120);
            });
            state.els.search.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    resetFilters();
                }
            });
            state.els.clearSearch.addEventListener('click', resetFilters);
        }

        state.els.onlyBtn.addEventListener('click', function () {
            state.onlySelected = !state.onlySelected;
            this.classList.toggle('is-active', state.onlySelected);
            this.setAttribute('aria-pressed', state.onlySelected ? 'true' : 'false');
            applyFilter();
        });

        state.els.clearAllBtn.addEventListener('click', clearSelection);

        // Quantities are changed by the module's own jQuery handlers, which do
        // not emit native events. Every such change still originates from a
        // user gesture inside the composer, so re-read state just after one.
        ['click', 'change', 'input', 'keyup'].forEach(function (type) {
            state.root.addEventListener(type, function (event) {
                if (closest(event.target, '.ipc-bar')) {
                    return;
                }
                window.requestAnimationFrame(refresh);
                setTimeout(refresh, 180);
            });
        });
    }

    /* ---------------------------------------------------------------- *
     *  Boot
     * ---------------------------------------------------------------- */

    function init() {
        var root = document.getElementById(ROOT_ID);
        if (!root || root.hasAttribute('data-ipc-enhanced')) {
            return;
        }

        var collected = collect(root);
        if (!collected.cards.length) {
            return;
        }

        root.setAttribute('data-ipc-enhanced', '1');
        root.classList.add('ipc-root');

        state.root = root;
        state.sections = collected.sections;
        state.cards = collected.cards;

        var bar = buildToolbar(collected.cards.length >= MIN_CARDS_FOR_SEARCH);
        root.insertBefore(bar, root.firstChild);

        buildNav();
        buildBadges();
        bind();
        refresh();
    }

    ready(init);
}());
