<?php

require_once dirname(__FILE__) . '/../../../config/config.inc.php';
require_once dirname(__FILE__) . '/../classes/InfobiaGuard.php';

/* Product configuration rows: read and delete, employees only. */
InfobiaGuard::requireEmployee();

$function = isset($_GET['function']) ? (string)$_GET['function'] : '';

switch ($function) {
    case 'GPCR':
        getProductConfigRow(isset($_POST['idProduct']) ? (int)$_POST['idProduct'] : 0);
        break;

    case 'deleteRelation':
        deleteRelation(isset($_POST['idRelation']) ? (int)$_POST['idRelation'] : 0);
        break;
}

function deleteRelation($idRelation)
{
    if ($idRelation <= 0) {
        return;
    }
    Db::getInstance()->execute('DELETE FROM `' . _DB_PREFIX_ . 'infobia_config_product` WHERE id_config_product = ' . (int)$idRelation);
}

function getProductConfigRow($idProduct)
{
    $sql = 'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_config_product` icp, `' . _DB_PREFIX_ . 'infobia_groupe` ig, `' . _DB_PREFIX_ . 'infobia_option` io
            WHERE icp.id_option = io.id_option AND icp.id_groupe = ig.id_groupe AND icp.id_product = ' . (int)$idProduct . '
            ORDER BY icp.id_groupe DESC';

    echo json_encode(Db::getInstance()->executeS($sql));
}
