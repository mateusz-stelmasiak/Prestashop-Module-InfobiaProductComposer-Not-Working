<?php

require_once dirname(__FILE__) . '/../../../config/config.inc.php';
require_once dirname(__FILE__) . '/../classes/InfobiaGuard.php';

/* Drag-and-drop ordering on the configuration screens: employees only. */
InfobiaGuard::requireEmployee();

$items = Tools::getValue('item');

if (is_array($items)) {
    $action = Tools::getValue('action');
    $id_opt = (int)Tools::getValue('option');
    $success = true;

    foreach ($items as $position => $item) {
        $pos = (int)$position + 1;

        if ($action == 'updateGroupPosition') {
            $success &= Db::getInstance()->execute('UPDATE `' . _DB_PREFIX_ . 'infobia_groupe` SET `position_groupe` = ' . $pos . ' WHERE `id_groupe` = ' . (int)$item);
        } elseif ($action == 'updateOptionPosition') {
            $success &= Db::getInstance()->execute('UPDATE `' . _DB_PREFIX_ . 'infobia_option` SET `position_option` = ' . $pos . ' WHERE `id_option` = ' . (int)$item);
        } elseif ($action == 'updateAttribPosition') {
            $success &= Db::getInstance()->execute('UPDATE `' . _DB_PREFIX_ . 'infobia_attributs` SET `position_attribut` = ' . $pos . ' WHERE `id_opt` = ' . $id_opt . ' AND `id_attribut` = ' . (int)$item);
        }
    }
}
