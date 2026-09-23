<?php
/*
 * Back-office helper for the product configuration tab. It bootstraps
 * PrestaShop itself and is reachable by URL, so it checks for a logged-in
 * employee first, and every id that reaches SQL is cast to an integer.
 */

if (!defined('_PS_VERSION_')) {
    include dirname(__FILE__) . '/../../../../config/config.inc.php';
}
require_once dirname(__FILE__) . '/../../classes/InfobiaGuard.php';

InfobiaGuard::requireEmployee();

$fct = isset($_POST['fct']) ? (string)$_POST['fct'] : '';

switch ($fct) {
    case 'groupe':
        addGroupe();
        break;

    case 'lst_options':
        loadOptionList();
        break;

    default:
        break;
}

if (isset($_POST['action']) && $_POST['action'] == 'SousOption') {
    $id_opt = isset($_POST['id_opt']) ? (int)$_POST['id_opt'] : 0;
    $datas = Db::getInstance()->executeS(
        'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_attributs` WHERE id_opt = ' . $id_opt
    );
    echo json_encode($datas);
    die();
}

function loadOptionList()
{
    $id_groupe = isset($_POST['id_groupe']) ? (int)$_POST['id_groupe'] : 0;
    $datas = Db::getInstance()->executeS(
        'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_groupe_option` WHERE id_groupe = ' . $id_groupe
    );
    echo json_encode($datas);
    die();
}

function addGroupe()
{
    $id_product = isset($_POST['id_product']) ? (int)$_POST['id_product'] : 0;
    if ($id_product <= 0) {
        die();
    }

    Db::getInstance()->execute(
        'DELETE FROM `' . _DB_PREFIX_ . 'infobia_config_product` WHERE id_product = ' . $id_product
    );

    $groupes = explode(',', isset($_POST['groupe']) ? (string)$_POST['groupe'] : '');
    foreach ($groupes as $groupe) {
        Db::getInstance()->insert('infobia_config_product', array(
            'id_product' => $id_product,
            'id_groupe' => (int)$groupe,
        ));
    }
    die();
}
