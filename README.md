# Prestashop-Module-Infobia-Product-Composer-Not-Working

# EN

As of 11/17/2023 the infobia API and what follows - the infobia-product-composer module no longer work. Here i provide a way to bypass any need for communication with the infobia API, so that the module can run in its absence.

This drop-in replacement also fixes the two things that hurt most on real shops: the number of SQL queries the composer issues, and how hard a large composer is to actually use.

## STEPS

1. Download `infobia_product_composer.php` and the `views/` folder from this repository.
2. Copy them into `_path_to_your_shop_/modules/infobia_product_composer`, overwriting `infobia_product_composer.php` and adding the two new files:
   - `views/js/infobia-ux.js`
   - `views/css/infobia-ux.css`
3. DONE.

The two `views/` files are **optional**. Copy only `infobia_product_composer.php` and the module keeps its original interface, just faster.

## WHAT CHANGED

### Fewer SQL queries

The original code walked the option tree node by node: one query per group, one per option, one per attribute, then two more *per attribute* to load its sub-options, plus a configuration lookup for every single attribute rendered. The tree is now loaded one level at a time, so a product costs a fixed handful of queries instead of a few hundred.

Measured on a product with 5 groups / 5 options / 33 attributes:

| Scenario | Before | After |
| --- | ---: | ---: |
| Shop displays TTC, attribute prices HT, 20% specific price | 86 queries | 6 queries |
| Shop displays TTC, attribute prices HT, no specific price | 86 queries | 6 queries |
| Shop displays HT, attribute prices HT, amount reduction | 119 queries | 6 queries |

The query count no longer grows with the size of the composer. The rendered tree is byte-for-byte identical to what the original code produced in all three scenarios, so templates and prices are unaffected.

Also fixed along the way:

- `getGroups()` hard-coded the `ps_` table prefix, breaking any shop installed with a custom prefix.
- Values were interpolated into SQL unescaped; every parameter is now cast or escaped.
- Saving the module configuration called the dead licence server and blocked the page until cURL timed out, then reported "invalid key". That call is gone.
- On the home-page hook, sub-option prices were converted using the tax rate of product `0` instead of the displayed product.
- Attribute quantities are now clamped to available stock on the home page too, as they already were on the product page.

### A usable interface for large composers

`views/js/infobia-ux.js` and `views/css/infobia-ux.css` add a layer on top of the existing markup. They do not replace it: prices, quantities and cart submission stay owned by `script_front.js`, so behaviour is unchanged.

- **Search** across all tiles, accent-insensitive and tolerant of Polish inflection ("zupa" finds "Zupy").
- **Live progress per category** — a `3 / 7` badge that turns green when the category is satisfied and red when it is over the limit, using the same rule the module validates on add-to-cart. Previously the shopper only found out on submit, via an alert.
- **Selection summary** listing everything picked, with click-to-scroll back to any tile.
- **Jump links** to each category, with their current counts.
- **"Only selected"** and **"clear selection"** shortcuts.
- A visible selected state on the tiles themselves.

# FR

Depuis le 17/11/2023, l'API infobia et ce qui en découle - le module infobia-product-composer - ne fonctionnent plus. Je propose ici un moyen de contourner tout besoin de communication avec l'API infobia, afin que le module puisse fonctionner en son absence.

Ce remplacement corrige également le nombre de requêtes SQL du module et l'ergonomie des composeurs volumineux.

## ÉTAPES

1. Téléchargez `infobia_product_composer.php` ainsi que le dossier `views/` de ce dépôt.
2. Copiez-les dans `_path_to_your_shop_/modules/infobia_product_composer`, en remplaçant `infobia_product_composer.php` et en ajoutant les deux nouveaux fichiers :
   - `views/js/infobia-ux.js`
   - `views/css/infobia-ux.css`
3. C'EST FAIT.

Les deux fichiers `views/` sont **optionnels** : en ne copiant que `infobia_product_composer.php`, le module conserve son interface d'origine, simplement plus rapide.

## CE QUI A CHANGÉ

- **Requêtes SQL** : l'arbre des options est désormais chargé niveau par niveau. Sur un produit de 5 groupes / 5 options / 33 attributs, on passe de 86-119 requêtes à 6, et ce nombre ne dépend plus de la taille du composeur. L'arbre produit est identique à l'octet près à celui du code d'origine.
- **Correctifs** : préfixe de table `ps_` codé en dur, valeurs non échappées dans les requêtes, appel au serveur de licence hors ligne qui bloquait la page de configuration, taux de TVA erroné pour les sous-options sur la page d'accueil.
- **Interface** : recherche dans les vignettes (insensible aux accents et aux flexions), compteur `3 / 7` en direct par catégorie, récapitulatif des choix, liens de navigation, filtres « uniquement sélectionnés » et « effacer la sélection ».
