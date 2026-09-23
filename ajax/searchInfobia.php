<?php
/* ************** INFOBIA ****************** */
require_once dirname(__FILE__) . '/../../../config/config.inc.php';
require_once dirname(__FILE__) . '/../classes/InfobiaGuard.php';

/* Product picker on the configuration screen: employees only. */
InfobiaGuard::requireEmployee();

$context = Context::getContext();
$search_query = trim((string)Tools::getValue('q'));
$sql = '
    SELECT p.id_product, pl.name, p.reference
    FROM `' . _DB_PREFIX_ . 'product` p
    LEFT JOIN `' . _DB_PREFIX_ . 'product_lang` pl ON pl.id_product = p.id_product
    WHERE pl.id_lang = ' . (int)$context->language->id . ' AND pl.id_shop = ' . (int)$context->shop->id . '
    AND (
        p.id_product = ' . (int)$search_query . '
        OR pl.name LIKE "%' . pSQL($search_query) . '%"
        OR p.reference LIKE "%' . pSQL($search_query) . '%"
        OR pl.description_short LIKE "%' . pSQL($search_query) . '%"
    )
    ORDER BY pl.name ASC
    LIMIT 50';

die(json_encode(Db::getInstance()->executeS($sql)));
