<?php
/**
 * Infobia Product Composer - community maintenance build.
 *
 * The infobia API went offline on 2023-11-17, which took the original module
 * with it. This drop-in replacement removes every dependency on that API and,
 * on top of that:
 *
 *  - builds the whole group / option / attribute tree with a fixed, small
 *    number of SQL queries instead of one query per node (the original issued
 *    several hundred queries on a product with a few dozen attributes),
 *  - ships an optional front-office enhancement layer (search, filtering,
 *    per-group progress, selection summary) that is layered on top of the
 *    stock markup, so the module's own price/cart JavaScript keeps working,
 *  - casts and escapes every value that reaches SQL.
 *
 * Public method signatures are unchanged so the module's admin controllers,
 * templates and AJAX endpoints keep working untouched.
 */

class infobia_product_composer extends Module
{
    /**
     * Front-office enhancement assets, relative to the module directory.
     * The minified build is preferred when present; the readable source is
     * the fallback, so the layer still works if only it was copied.
     */
    const UX_CSS = 'views/css/infobia-ux.css';
    const UX_JS = 'views/js/infobia-ux.js';
    const UX_CSS_MIN = 'views/css/infobia-ux.min.css';
    const UX_JS_MIN = 'views/js/infobia-ux.min.js';

    /* @var boolean error */
    protected $error = false;

    /**
     * Per-request caches. Every one of these used to be a repeated SQL query
     * executed once per attribute while rendering a single product page.
     */
    protected static $apparence_cache = null;
    protected static $tax_rate_cache = array();
    protected static $price_display_method = null;
    protected static $price_round_mode = null;
    protected static $config_product_cache = array();
    protected static $name_group_cache = array();

    public function __construct()
    {
        $this->name = 'infobia_product_composer';
        $this->tab = 'front_office_features';

        $this->version = '1.3';
        $this->author = 'Infobia';
        $this->need_instance = 0;
        $this->class_name = 'AdminInfobiaModuleIPC';
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('Infobia Product Composer');
        $this->description = $this->l('Ce module permet de calculer dynamiquement le prix d\'un produit');
        $this->confirmUninstall = $this->l('Etes vous sûre de supprimer ce module ?');
    }

    public function install()
    {
        $this->changeOverrideBeforeinstall();
        return parent::install()
            && $this->registerHook('displayHeader')
            && $this->registerHook('displayBackOfficeHeader')
            && $this->registerHook('displayHome')
            && $this->registerHook('displayReassurance')
            && $this->registerHook('displayFooterProduct')
            && $this->registerHook('displayCartExtraProductActions')
            && $this->registerHook('displayProductActions') //quickview
            && $this->registerHook('displayProductPriceBlock')
            && $this->resetDb();
    }

    public function changeOverrideBeforeinstall()
    {

        $functionsNames = array("function getOrderTotal(", "function getProducts(", "function updateQty(");

        $cart = file_get_contents(dirname(__FILE__, 3) . '/classes/Cart.php');
        $override_cart = file_get_contents(dirname(__FILE__, 3) . '/modules/' . $this->name . '/override/classes/Cart.php');

        foreach ($functionsNames as $name) {

            $listeParams = array();
            {

                $index = strpos($cart, $name);
                $result = substr($cart, $index);

                $params = substr($result, 0, strpos($result, ')'));

                $index1 = strpos($cart, $name) + strlen($name);
                $result1 = substr($cart, $index1);
                $params1 = substr($result1, 0, strpos($result1, ')'));
                $listeParams = explode(",", $params1);

                $indexOv = strpos($override_cart, $name);
                $resultOv = substr($override_cart, $indexOv);
                $paramsOv = substr($resultOv, 0, strpos($resultOv, ')'));

                $override_cart = str_replace($paramsOv, $params, $override_cart);


                $listeParamsWtValue = "";
                foreach ($listeParams as $param) {
                    $val = explode('=', $param);
                    if ($listeParamsWtValue != "") $listeParamsWtValue = $listeParamsWtValue . ',';
                    $index2 = strpos($val[0], '$');
                    $result2 = substr($val[0], $index2);


                    $listeParamsWtValue .= $result2;
                }


                $name = str_replace("function ", "parent::", $name);
                $indexOv = strpos($override_cart, $name);
                $resultOv = substr($override_cart, $indexOv);
                $paramsOv = substr($resultOv, 0, strpos($resultOv, ')'));
                $override_cart = str_replace($paramsOv, $name . $listeParamsWtValue, $override_cart);


                file_put_contents(dirname(__FILE__, 3) . '/modules/' . $this->name . '/override/classes/Cart.php', $override_cart);

            }

        }

        return true;
    }

    private function resetDb()
    {
        $tab = new Tab();
        $tab->name = array();

        foreach (Language::getLanguages() as $language) {
            $tab->name[$language['id_lang']] = $this->displayName;
        }

        $tab->class_name = $this->class_name;
        $tab->id_parent = (int)Tab::getIdFromClassName('IMPROVE');//76 si prestashop 1.7
        $tab->module = $this->name;
        $tab->icon = "flash_on";
        $tab->add();

        $id_parent = (int)Tab::getIdFromClassName($this->class_name);

        $tabs = array("AdminInfobiaGroupe" => 'Liste Groupes', "AdminInfobiaOptions" => 'Liste Options', "AdminInfobiaAttribute" => 'Liste Attributs', "AdminInfobiaProd" => 'Configuration produits', "AdminInfobiaConfig" => 'Configuration interface');

        foreach ($tabs as $key => $val) {
            $tab = new Tab();
            $tab->name = array();
            foreach (Language::getLanguages() as $language) {
                $tab->name[$language['id_lang']] = $this->l($val);
            }

            $tab->class_name = $key;
            $tab->id_parent = $id_parent;
            $tab->module = $this->name;

            $tab->add();
        }

        $sql_file = "../modules/" . $this->name . "/sql-install.sql";
        if (!$this->loadSQLFile($sql_file)) {
            return false;
        }
        return true;
    }

    public function loadSQLFile($sql_file)
    {
        $sql_content = file_get_contents($sql_file);
        $sql_content = str_replace('ps_', _DB_PREFIX_, $sql_content);
        $sql_requests = preg_split("/;\s*[\r\n]+/", $sql_content);

        $result = true;
        foreach ($sql_requests as $request) {
            if (!empty($request)) $result = Db::getInstance()->execute(trim($request));
        }
        return $result;
    }


    public function getContent()
    {
        $output = null;
        if (Tools::isSubmit('submit' . $this->name)) {

            $myModuleName = strval(Tools::getValue('INFOBIA_COMPOSER_KEY'));
            if (!$myModuleName || empty($myModuleName) || !Validate::isGenericName($myModuleName)) {
                $output .= $this->displayError($this->l('Invalid Configuration value'));
            } else {
                Configuration::updateValue('INFOBIA_COMPOSER_KEY', $myModuleName);
                $output .= $this->displayConfirmation($this->l('Settings updated'));
            }

            // The licence server (infobia-online.com) is gone. Calling it only
            // stalled this page until cURL timed out and then reported an
            // invalid key, so the check is deliberately skipped here.
        }
        return $output . $this->displayForm();
    }


    public function verificationToken($myModuleName)
    {
        return $this->sendCurl('CHECK_KEY');
    }


    /**
     * The infobia API is permanently offline. This stub keeps the method
     * available for any caller that still references it while guaranteeing no
     * outbound request (and therefore no page-long cURL timeout) is made.
     */
    public function sendCurl($fct)
    {
        return false;
    }

    public function displayForm()
    {
        $defaultLang = (int)Configuration::get('PS_LANG_DEFAULT');
        $fieldsForm[0]['form'] = [
            'legend' => [
                'title' => $this->l('Settings'),
            ],
            'input' => [
                [
                    'type' => 'text',
                    'label' => $this->l('Clé de licence'),
                    'name' => 'INFOBIA_COMPOSER_KEY',
                    'size' => 20,
                    'required' => false
                ]


            ],

            'submit' => [
                'title' => $this->l('Save'),
                'class' => 'btn btn-default pull-right'
            ]
        ];

        $helper = new HelperForm();

        // Module, token and currentIndex
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
        // Language
        $helper->default_form_language = $defaultLang;
        $helper->allow_employee_form_lang = $defaultLang;
        // Title and toolbar
        $helper->title = $this->displayName;
        $helper->show_toolbar = false;        // false -> remove toolbar
        $helper->toolbar_scroll = true;      // yes - > Toolbar is always visible on the top of the screen.
        $helper->submit_action = 'submit' . $this->name;
        $helper->toolbar_btn = [
            'save' => [
                'desc' => $this->l('Save'),
                'href' => AdminController::$currentIndex . '&configure=' . $this->name . '&save' . $this->name .
                    '&token=' . Tools::getAdminTokenLite('AdminModules'),
            ],
            'back' => [
                'href' => AdminController::$currentIndex . '&token=' . Tools::getAdminTokenLite('AdminModules'),
                'desc' => $this->l('Back to list')
            ]
        ];

        $helper->fields_value['INFOBIA_COMPOSER_KEY'] = Configuration::get('INFOBIA_COMPOSER_KEY');
        return $helper->generateForm($fieldsForm);
    }


    public function uninstall()
    {

        $sql_file = "../modules/" . $this->name . "/sql-uninstall.sql";
        if (!$this->loadSQLFile($sql_file)) {
            return false;
        }

        if (!parent::uninstall()) {
            return false;
        }
        return true;
    }

    /* ------------------------------------------------------------------ *
     *  Front office hooks
     * ------------------------------------------------------------------ */

    //ajout des js et css dans la partie front office
    public function hookDisplayHeader()
    {
        if ((Tools::getValue("controller", "") == "product") || (Tools::getValue("controller") == "index")) {
            $config = $this->getBcConfigProduct();

            if ((count($config) > 0) || (Tools::getValue("controller") == "index")) {
                $this->context->controller->addJquery();

                $this->context->controller->addJS($this->_path . 'views/js/script_front.js', 'all');

                $this->context->controller->registerStylesheet('infobia-back', $this->_path . 'views/css/infobia-back.css');
                $this->context->controller->addCSS($this->_path . 'views/css/infobia-front.css');

                // DataTables used to be loaded here as well, 82.3 KiB of
                // library plus a stylesheet from cdn.datatables.net, on every
                // product and home page. Nothing in the front office ever
                // called it: it is only used by the back-office attribute
                // screens, which still load it in hookDisplayBackOfficeHeader.

                $this->addUxAssets();
            }
        }
        $this->context->controller->addJquery();

        $this->context->controller->addJS($this->_path . 'views/js/cart.js', 'all');
    }

    /**
     * Registers the optional enhancement layer. Shops that copied only this
     * PHP file simply keep the stock interface - nothing is registered and
     * nothing is wrapped.
     */
    protected function addUxAssets()
    {
        $css = $this->uxAsset(self::UX_CSS_MIN, self::UX_CSS);
        $js = $this->uxAsset(self::UX_JS_MIN, self::UX_JS);

        if (!$css || !$js) {
            return;
        }

        $this->context->controller->addCSS($this->_path . $css, 'all');
        $this->context->controller->addJS($this->_path . $js, 'all');
    }

    /** Minified build if it was copied, else the readable source, else null. */
    protected function uxAsset($minified, $source)
    {
        foreach (array($minified, $source) as $candidate) {
            if (file_exists(dirname(__FILE__) . '/' . $candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    protected function hasUxAssets()
    {
        return $this->uxAsset(self::UX_CSS_MIN, self::UX_CSS) !== null
            && $this->uxAsset(self::UX_JS_MIN, self::UX_JS) !== null;
    }

    public function hookDisplayBackOfficeHeader()
    {
        $controller = Tools::getValue('controller', "");

        $tabs = array("AdminInfobiaGroupe", "AdminInfobiaOptions", "AdminInfobiaAttribute", "AdminInfobiaProd", "AdminInfobiaConfig", "AdminInfobiaSec");

        if (in_array($controller, $tabs)) {
            $this->context->controller->addJquery();
            $this->context->controller->addJS($this->_path . 'views/js/script_back.js', 'all');
            $this->context->controller->addJS($this->_path . 'js/jquery.dataTables.min.js', 'all');
            $this->context->controller->addCSS($this->_path . 'views/css/infobia-back.css');
            $this->context->controller->addCSS('https://cdn.datatables.net/1.10.20/css/jquery.dataTables.min.css');
        }
    }


    public function hookDisplayHome($params)
    {
        $id_lang = (int)$this->context->language->id;
        $token = Tools::getToken(false);

        $ProductHome = $this->getProductHome();

        if (!isset($ProductHome['id_product'])) {
            return;
        }

        $id_product = (int)$ProductHome['id_product'];

        $product = new Product($id_product, true, $id_lang);
        $priceCalculationMethod = $this->getPriceDisplayMethod();
        $usetax = ($priceCalculationMethod != 1);
        $showPriceMethod = $usetax ? "TTC" : "HT";

        $price = Product::getPriceStatic($id_product, $usetax, null, 6, null, false, false);
        $price_without_reduction = Product::getPriceStatic($id_product, $usetax, null, 6, null, false, false);

        $image_url = '';
        $id_image = Product::getCover($id_product);
        if (is_array($id_image) && isset($id_image['id_image'])) {
            $image = new Image($id_image['id_image']);
            $image_url = _PS_BASE_URL_ . _THEME_PROD_DIR_ . $image->getExistingImgPath() . ".jpg";
        }

        $specific_price = $this->getSpecificPriceForProduct($id_product);
        $reduction_data = $this->normalizeReduction($specific_price, $id_product, $priceCalculationMethod);

        // The whole group/option/attribute tree, batched.
        $results = $this->buildComposerTree($id_product);

        $cur = new Currency((int)$this->context->currency->id);
        $name_group = $this->getNameGroupRow($id_product);

        $this->context->smarty->assign(array(
            'initialprice' => $price,
            'url_image' => $image_url,
            'results' => $results,
            'apparence' => $this->getApparence(),
            'product' => $product,
            'token' => $token,
            'baseUrl' => _PS_BASE_URL_SSL_ . __PS_BASE_URI__,
            'currency_symbol' => $cur->symbol,
            'price_round' => $this->getPriceRoundMode(),
            'module_name' => $this->name,
            'reduction' => $reduction_data['reduction'],
            'reduction_type' => $reduction_data['reduction_type'],
            'showPriceMethod' => $showPriceMethod,
            'hide_name_group' => $this->nameGroupField($name_group, 'hide_name_group'),
            'hide_min_max' => $this->nameGroupField($name_group, 'hide_min_max'),
            "price_without_reduction" => $price_without_reduction,
        ));

        return $this->display(__FILE__, 'home_productInfobia.tpl');
    }


    public function hookDisplayReassurance($params)
    {
        if (Tools::getValue("controller", "") != "product") {
            return;
        }

        $config = $this->getBcConfigProduct();
        if (count($config) == 0) {
            return;
        }

        $id_product = (int)Tools::getValue('id_product');
        $priceCalculationMethod = $this->getPriceDisplayMethod();

        $specific_price = $this->getSpecificPriceForProduct($id_product);
        $reduction_data = $this->normalizeReduction($specific_price, $id_product, $priceCalculationMethod);

        // Single batched build: ~5 queries whatever the size of the tree.
        $results = $this->buildComposerTree($id_product, $specific_price);

        $cur = new Currency((int)$this->context->currency->id);
        $name_group = $this->getNameGroupRow($id_product);

        $this->context->smarty->assign(array(
            'results' => $results,
            'config' => $config,
            'apparence' => $this->getApparence(),
            'currency_symbol' => $cur->symbol,
            'baseUrl' => _PS_BASE_URL_SSL_ . __PS_BASE_URI__,
            'module_name' => $this->name,
            'hide_name_group' => $this->nameGroupField($name_group, 'hide_name_group'),
            'hide_min_max' => $this->nameGroupField($name_group, 'hide_min_max'),
            'price_round' => $this->getPriceRoundMode(),
            'reduction' => $reduction_data['reduction'],
            'reduction_type' => $reduction_data['reduction_type'],
            'url' => Context::getContext()->link->getModuleLink($this->name, 'ajax_module'),
        ));

        return $this->display(__FILE__, 'front_infobiaHook_module.tpl');
    }

    public function hookDisplayFooterProduct($params)
    {
        $config = $this->getBcConfigProduct();
        if (!empty($config)) {
            $this->context->smarty->assign(array(
                'cover' => $params['product']['cover'],
                'config' => $config,
                'product' => $params['product']
            ));
            return $this->display(__FILE__, 'displayFooterPrice.tpl');
        }
    }

    public function hookDisplayCartExtraProductActions($params)
    {
        $controller = Tools::getValue("controller");

        if ($controller != "orderconfirmation" && $controller != "cart") {
            return;
        }

        $id_product = (int)$params['product']['id_product'];
        $id_customization = (int)$params['product']['id_customization'];

        if ($controller == "orderconfirmation") {
            $id_cart = (int)Tools::getValue("id_cart");
        } else {
            $id_cart = (int)$this->context->cart->id;
        }

        if ($id_customization <= 0 || $id_cart <= 0) {
            return;
        }

        $InfobiaProd = $this->getBcConfigProducts($id_product);
        if (!$InfobiaProd) {
            return;
        }

        $res = Db::getInstance()->executeS(
            'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_cart`
             WHERE id_product = ' . (int)$id_product . '
               AND id_cart = ' . (int)$id_cart . '
               AND id_customization = ' . (int)$id_customization
        );

        if (empty($res) || empty($res[0]['attributes'])) {
            return;
        }

        $this->context->smarty->assign(array(
            'res' => $res,
            'attributes' => json_decode($res[0]['attributes']),
            'urlUploads' => _PS_BASE_URL_SSL_ . __PS_BASE_URI__ . "modules/" . $this->name . "/uploads/",
            'controller' => $controller,
            'id_product' => $id_product,
            'id_customization' => $id_customization,
        ));

        return $this->display(__FILE__, 'displayCartExtraProductActions.tpl');
    }

    public function hookDisplayProductPriceBlock($params)
    {
        return $this->hookDisplayCartExtraProductActions($params);
    }

    public function hookDisplayProductActions($params)
    {
        if (Tools::getValue('action') == 'quickview') {
            $id_product = (int)Tools::getValue('id_product');
            $config = $this->getBcConfigProducts($id_product);

            if ($config) {
                $this->context->smarty->assign(array(
                    'link' => $this->context->link->getProductLink($id_product),
                    'apparence' => $this->getApparence(),
                    'prod_id' => $id_product
                ));
                return $this->display(__FILE__, 'listing.tpl');
            }
        }
    }

    /* ------------------------------------------------------------------ *
     *  Batched tree building
     *
     *  The original code walked the tree node by node: one query per group,
     *  one per option, one per attribute, then - for every single attribute -
     *  another getOptionsAttributes() call that itself issued two queries per
     *  child option plus two configuration lookups. A product with five
     *  groups and thirty attributes cost well over two hundred queries.
     *
     *  buildComposerTree() fetches the tree one *level* at a time, so the
     *  cost is five queries (groups, options, attributes, child options,
     *  child attributes) no matter how many nodes there are.
     * ------------------------------------------------------------------ */

    /**
     * @param int $id_product
     * @param array|false $specific_price applied to first-level attributes only,
     *                                    matching the historical behaviour.
     * @return array groups, each with ['values' => options[['attributs' => [...]]]]
     */
    protected function buildComposerTree($id_product, $specific_price = array())
    {
        $id_product = (int)$id_product;

        $groups = $this->getGroups($id_product);
        if (empty($groups)) {
            return array();
        }

        $group_ids = array();
        foreach ($groups as $group) {
            $group_ids[] = (int)$group['id_groupe'];
        }

        // Level 1: every option of every group, in one query.
        $options_by_group = $this->fetchOptionsByGroups($id_product, $group_ids);

        $option_ids = array();
        foreach ($options_by_group as $options) {
            foreach ($options as $option) {
                $option_ids[] = (int)$option['id_option'];
            }
        }

        // Level 2: every attribute of every option, in one query.
        $attributes_by_option = $this->fetchAttributesByOptions($option_ids, $specific_price, $id_product);
        $this->postProcessAttributes($attributes_by_option, $id_product);

        $attribute_ids = array();
        foreach ($attributes_by_option as $attributes) {
            foreach ($attributes as $attribute) {
                $attribute_ids[] = (int)$attribute['id_attribut'];
            }
        }

        // Level 3 + 4: child options and their attributes, one query each.
        $child_options_by_attribute = $this->fetchChildOptionsByAttributes($attribute_ids);

        $child_option_ids = array();
        foreach ($child_options_by_attribute as $child_options) {
            foreach ($child_options as $child_option) {
                $child_option_ids[] = (int)$child_option['id_option'];
            }
        }

        $child_attributes_by_option = $this->fetchAttributesByOptions($child_option_ids);
        $this->postProcessAttributes($child_attributes_by_option, $id_product);

        // Assemble, without a single further query.
        $results = array();
        foreach ($groups as $group) {
            $id_groupe = (int)$group['id_groupe'];
            $options = isset($options_by_group[$id_groupe]) ? $options_by_group[$id_groupe] : array();

            foreach ($options as $option_index => $option) {
                $id_option = (int)$option['id_option'];
                $attributes = isset($attributes_by_option[$id_option]) ? $attributes_by_option[$id_option] : array();

                foreach ($attributes as $attribute_index => $attribute) {
                    $id_attribut = (int)$attribute['id_attribut'];
                    $children = isset($child_options_by_attribute[$id_attribut])
                        ? $child_options_by_attribute[$id_attribut]
                        : array();

                    foreach ($children as $child_index => $child_option) {
                        $id_child_option = (int)$child_option['id_option'];
                        $child_attributes = isset($child_attributes_by_option[$id_child_option])
                            ? $child_attributes_by_option[$id_child_option]
                            : array();

                        foreach ($child_attributes as $child_attribute_index => $child_attribute) {
                            $child_attributes[$child_attribute_index]['hasFils'] = "0";
                        }

                        $children[$child_index]['attributs'] = $child_attributes;
                    }

                    $attributes[$attribute_index]['hasFils'] = empty($children) ? "0" : "1";
                    $attributes[$attribute_index]['fils'] = $children;
                }

                $options[$option_index]['attributs'] = $attributes;
            }

            $group['values'] = $options;
            $results[] = $group;
        }

        return $results;
    }

    /**
     * Stock clamping and HT/TTC conversion, applied once per attribute row
     * instead of once per place the row is rendered.
     *
     * @param array $attributes_by_option modified in place
     */
    protected function postProcessAttributes(&$attributes_by_option, $id_product)
    {
        if (empty($attributes_by_option)) {
            return;
        }

        $price_display_method = $this->getPriceDisplayMethod();
        $method_price_attr = $this->getApparenceValue('prix_attrib', 'ttc');
        $tax_rate = $this->getTaxRate($id_product);

        foreach ($attributes_by_option as $id_option => $attributes) {
            foreach ($attributes as $index => $attribute) {
                if (isset($attribute['gestion_stock']) && $attribute['gestion_stock'] == 1
                    && $attribute['qte_stock'] < $attribute['max_attribut']) {
                    $attributes[$index]['max_attribut'] = $attribute['qte_stock'];
                }

                $attributes[$index]['prix_attribut'] = $this->convertAttributePrice(
                    $attribute['prix_attribut'],
                    $price_display_method,
                    $method_price_attr,
                    $tax_rate
                );
            }
            $attributes_by_option[$id_option] = $attributes;
        }
    }

    /**
     * Converts an attribute price between the price it was entered in and the
     * one the shop displays. Kept bit-for-bit identical to the original
     * arithmetic, including using PS_PRICE_ROUND_MODE as a decimal count.
     */
    protected function convertAttributePrice($price, $price_display_method, $method_price_attr, $tax_rate)
    {
        if ($price_display_method == 0 && $method_price_attr == "ht") {
            $amount = $price + (($price * $tax_rate) / 100);
        } elseif ($price_display_method == 1 && $method_price_attr == "ttc") {
            $amount = $price / (1 + ($tax_rate / 100));
        } else {
            return $price;
        }

        return number_format($amount, (int)$this->getPriceRoundMode(), '.', '');
    }

    /**
     * All options of the given groups for one product. Replaces one query per
     * group. Returns [id_groupe => option rows].
     */
    protected function fetchOptionsByGroups($id_product, array $group_ids)
    {
        $group_ids = $this->sanitizeIds($group_ids);
        if (empty($group_ids)) {
            return array();
        }

        $sql = 'SELECT icp.*, io.*, icp.id_groupe AS ipc_group_key
                FROM `' . _DB_PREFIX_ . 'infobia_config_product` icp
                INNER JOIN `' . _DB_PREFIX_ . 'infobia_option` io ON icp.id_option = io.id_option
                WHERE icp.id_product = ' . (int)$id_product . '
                  AND icp.id_groupe IN (' . implode(',', $group_ids) . ')
                ORDER BY io.position_option';

        return $this->groupRowsBy(Db::getInstance()->executeS($sql), 'ipc_group_key');
    }

    /**
     * All child options of the given attributes. Replaces one query per
     * attribute. Returns [id_attribut => option rows].
     */
    protected function fetchChildOptionsByAttributes(array $attribute_ids)
    {
        $attribute_ids = $this->sanitizeIds($attribute_ids);
        if (empty($attribute_ids)) {
            return array();
        }

        $sql = 'SELECT iaoe.*, io.*, iaoe.id_attribut AS ipc_attribute_key
                FROM `' . _DB_PREFIX_ . 'infobia_attribut_option_enfant` iaoe
                INNER JOIN `' . _DB_PREFIX_ . 'infobia_option` io ON iaoe.id_option = io.id_option
                WHERE iaoe.id_attribut IN (' . implode(',', $attribute_ids) . ')
                ORDER BY io.position_option';

        return $this->groupRowsBy(Db::getInstance()->executeS($sql), 'ipc_attribute_key');
    }

    /**
     * All sellable attributes of the given options. Replaces one query per
     * option. Returns [id_opt => attribute rows].
     */
    protected function fetchAttributesByOptions(array $option_ids, $specific_price = array(), $id_product = 0)
    {
        $option_ids = $this->sanitizeIds($option_ids);
        if (empty($option_ids)) {
            return array();
        }

        $sql = 'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_attributs`
                WHERE id_opt IN (' . implode(',', $option_ids) . ')
                  AND IF(gestion_stock = 0, true, (qte_stock >= min_attribut AND qte_stock > 0))
                  AND active = 1
                ORDER BY position_attribut';

        $rows = Db::getInstance()->executeS($sql);
        if (!is_array($rows)) {
            return array();
        }

        $this->applySpecificPrice($rows, $specific_price, $id_product);

        return $this->groupRowsBy($rows, 'id_opt', false);
    }

    /**
     * Applies a PrestaShop specific price to composer attribute prices,
     * when the module is configured to do so.
     *
     * @param array $rows modified in place
     */
    protected function applySpecificPrice(&$rows, $specific_price, $id_product)
    {
        if (empty($specific_price) || !is_array($specific_price)) {
            return;
        }
        if ($this->getApparenceValue('apply_reduct_ps', 0) != 1) {
            return;
        }

        $tax_rate = $this->getTaxRate($id_product);
        $reduction_type = isset($specific_price['reduction_type']) ? $specific_price['reduction_type'] : '';
        $reduction_tax = isset($specific_price['reduction_tax']) ? $specific_price['reduction_tax'] : 0;
        $method_price_attr = $this->getApparenceValue('prix_attrib', 'ttc');

        foreach ($rows as $index => $row) {
            $reduction = $specific_price['reduction'];

            $rows[$index]['price_without_reduction'] = (float)$row['prix_attribut'];

            if ($reduction_type == "percentage") {
                $rows[$index]['prix_attribut'] = $row['prix_attribut'] - ($row['prix_attribut'] * $reduction);
            }

            if ($reduction_type == "amount") {
                if ($method_price_attr == "ht" && $reduction_tax == 1) {
                    $reduction = $reduction - (float)($reduction * $tax_rate) / 100;
                }
                if ($method_price_attr == "ttc" && $reduction_tax == 0) {
                    $reduction = $reduction + (float)($reduction * $tax_rate) / 100;
                }

                $rows[$index]['prix_attribut'] = $row['prix_attribut'] - (float)$reduction;
            }
        }
    }

    /**
     * Groups result rows by a column, optionally dropping that column from the
     * returned rows (used for the join keys this class adds internally, so
     * templates keep seeing exactly the columns they used to).
     */
    protected function groupRowsBy($rows, $key, $unset_key = true)
    {
        $grouped = array();
        if (!is_array($rows)) {
            return $grouped;
        }

        foreach ($rows as $row) {
            if (!isset($row[$key])) {
                continue;
            }
            $bucket = (int)$row[$key];
            if ($unset_key) {
                unset($row[$key]);
            }
            $grouped[$bucket][] = $row;
        }

        return $grouped;
    }

    /** @return int[] unique, positive, integer-cast ids */
    protected function sanitizeIds(array $ids)
    {
        $clean = array();
        foreach ($ids as $id) {
            $id = (int)$id;
            if ($id > 0) {
                $clean[$id] = $id;
            }
        }

        return array_values($clean);
    }

    /** The product's active specific price, or false. */
    protected function getSpecificPriceForProduct($id_product)
    {
        return SpecificPrice::getSpecificPrice(
            (int)$id_product,
            (int)$this->context->shop->id,
            (int)$this->context->currency->id,
            (int)Context::getContext()->country->id,
            (int)Group::getCurrent()->id,
            1
        );
    }

    /**
     * Turns a specific price into the {reduction, reduction_type} pair the
     * templates expect, converting the amount between HT and TTC when the
     * shop displays prices the other way round.
     */
    protected function normalizeReduction($specific_price, $id_product, $price_display_method)
    {
        $result = array('reduction' => "", 'reduction_type' => "");

        if (empty($specific_price) || !is_array($specific_price)) {
            return $result;
        }

        $reduction = $specific_price['reduction'];
        $reduction_type = $specific_price['reduction_type'];
        $reduction_tax = $specific_price['reduction_tax'];

        if ($reduction_type != "percentage") {
            $tax_rate = $this->getTaxRate($id_product);

            if ($price_display_method == 1 && $reduction_tax == 1) {
                $reduction = $reduction / (1 + ($tax_rate / 100));
            }

            if ($price_display_method == 0 && $reduction_tax == 0) {
                $reduction = $reduction + (($reduction * $tax_rate) / 100);
            }
        }

        $result['reduction'] = $reduction;
        $result['reduction_type'] = $reduction_type;

        return $result;
    }

    /* ------------------------------------------------------------------ *
     *  Data access - public signatures preserved, now cached and escaped
     * ------------------------------------------------------------------ */

    /** The infobia_name_group row for a product, fetched at most once. */
    protected function getNameGroupRow($id_product)
    {
        $id_product = (int)$id_product;

        if (!array_key_exists($id_product, self::$name_group_cache)) {
            $rows = Db::getInstance()->executeS(
                'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_name_group` WHERE id_product = ' . $id_product
            );
            self::$name_group_cache[$id_product] = (is_array($rows) && !empty($rows)) ? $rows[0] : array();
        }

        return self::$name_group_cache[$id_product];
    }

    /** Mirrors the single-column shape the templates expect. */
    protected function nameGroupField($row, $field)
    {
        if (empty($row) || !isset($row[$field])) {
            return "";
        }

        return array($field => $row[$field]);
    }

    public function getHideNameGroup($id_product)
    {
        return $this->nameGroupField($this->getNameGroupRow($id_product), 'hide_name_group');
    }

    public function getHideMinMax($id_product)
    {
        return $this->nameGroupField($this->getNameGroupRow($id_product), 'hide_min_max');
    }

    public function getGroups($id_product)
    {
        // The original hard-coded the `ps_` table prefix here, which broke any
        // shop installed with a custom prefix.
        $sql = 'SELECT g.*
                FROM `' . _DB_PREFIX_ . 'infobia_groupe` AS g
                INNER JOIN `' . _DB_PREFIX_ . 'infobia_config_product` AS cp ON g.id_groupe = cp.id_groupe
                WHERE cp.id_product = ' . (int)$id_product;

        $res = Db::getInstance()->executeS($sql);

        return is_array($res) ? $res : array();
    }

    public function getBcConfigProduct()
    {
        if (!isset($_GET['id_product'])) {
            return array();
        }

        return $this->getBcConfigProducts((int)$_GET['id_product']);
    }

    public function getBcConfigProducts($id)
    {
        $id = (int)$id;

        if (!array_key_exists($id, self::$config_product_cache)) {
            $res = Db::getInstance()->executeS(
                'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_config_product` WHERE id_product = ' . $id
            );
            self::$config_product_cache[$id] = is_array($res) ? $res : array();
        }

        return self::$config_product_cache[$id];
    }

    public function getGroupes()
    {
        $sql = 'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_groupe` ORDER BY id_groupe DESC';
        return Db::getInstance()->executeS($sql);
    }

    public function getOptions($id_groupe = null, $id_attrib = null, $id_product = null)
    {
        if ($id_groupe) {
            $sql = 'SELECT icp.*, io.*
                    FROM `' . _DB_PREFIX_ . 'infobia_config_product` icp
                    INNER JOIN `' . _DB_PREFIX_ . 'infobia_option` io ON icp.id_option = io.id_option
                    WHERE icp.id_product = ' . (int)$id_product . '
                      AND icp.id_groupe = ' . (int)$id_groupe . '
                    ORDER BY io.position_option';
        } elseif ($id_attrib) {
            $sql = 'SELECT iaoe.*, io.*
                    FROM `' . _DB_PREFIX_ . 'infobia_attribut_option_enfant` iaoe
                    INNER JOIN `' . _DB_PREFIX_ . 'infobia_option` io ON iaoe.id_option = io.id_option
                    WHERE iaoe.id_attribut = ' . (int)$id_attrib . '
                    ORDER BY io.position_option';
        } else {
            $sql = 'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_option` ORDER BY id_option DESC';
        }

        return Db::getInstance()->executeS($sql);
    }

    /**
     * Kept for callers outside this class (AJAX controller, admin screens).
     * The front-office render path no longer uses it - buildComposerTree()
     * resolves the same data for the whole page in two queries instead of two
     * per attribute.
     */
    public function getOptionsAttributes($id_attrib)
    {
        $id_product = (int)Tools::getValue('id_product', 0);

        $options_by_attribute = $this->fetchChildOptionsByAttributes(array((int)$id_attrib));
        $options = isset($options_by_attribute[(int)$id_attrib]) ? $options_by_attribute[(int)$id_attrib] : array();
        if (empty($options)) {
            return array();
        }

        $option_ids = array();
        foreach ($options as $option) {
            $option_ids[] = (int)$option['id_option'];
        }

        $attributes_by_option = $this->fetchAttributesByOptions($option_ids);
        $this->postProcessAttributes($attributes_by_option, $id_product);

        foreach ($options as $index => $option) {
            $id_option = (int)$option['id_option'];
            $attributes = isset($attributes_by_option[$id_option]) ? $attributes_by_option[$id_option] : array();

            foreach ($attributes as $attribute_index => $attribute) {
                $attributes[$attribute_index]['hasFils'] = "0";
            }

            $options[$index]['attributs'] = $attributes;
        }

        return $options;
    }

    public function getAttributes($id_opt = null, $specific_price = array())
    {
        if ($id_opt) {
            $id_opt = (int)$id_opt;
            $attributes = $this->fetchAttributesByOptions(
                array($id_opt),
                $specific_price,
                (int)Tools::getValue('id_product', 0)
            );

            return isset($attributes[$id_opt]) ? $attributes[$id_opt] : array();
        }

        return Db::getInstance()->executeS(
            'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_attributs` ORDER BY id_attribut DESC'
        );
    }

    public function getConfigProduct($product_id)
    {
        $groupe_config = array();
        foreach ($this->getBcConfigProducts($product_id) as $groupe) {
            $groupe_config[] = $groupe['id_groupe'];
        }

        return $groupe_config;
    }

    /**
     * The whole infobia_config table is read once per request and filtered in
     * PHP. The original ran a query for every lookup, and there was at least
     * one lookup per attribute rendered.
     */
    public function getApparence($name = "")
    {
        if (self::$apparence_cache === null) {
            $rows = Db::getInstance()->executeS(
                'SELECT * FROM `' . _DB_PREFIX_ . 'infobia_config` ORDER BY id'
            );
            self::$apparence_cache = is_array($rows) ? $rows : array();
        }

        if ($name === "") {
            return self::$apparence_cache;
        }

        $matches = array();
        foreach (self::$apparence_cache as $row) {
            if (isset($row['name']) && $row['name'] === $name) {
                $matches[] = $row;
            }
        }

        return $matches;
    }

    /** Null-safe single setting lookup. */
    public function getApparenceValue($name, $default = null)
    {
        $rows = $this->getApparence($name);

        return isset($rows[0]['value']) ? $rows[0]['value'] : $default;
    }

    public function getProductHome()
    {
        $data = Db::getInstance()->executeS(
            'SELECT `id_product` FROM `' . _DB_PREFIX_ . 'infobia_name_group` WHERE show_in_home = 1'
        );

        return $data ? $data[0] : array();
    }

    /* ---- cached PrestaShop lookups ---- */

    protected function getTaxRate($id_product)
    {
        $id_product = (int)$id_product;

        if (!array_key_exists($id_product, self::$tax_rate_cache)) {
            self::$tax_rate_cache[$id_product] = Tax::getProductTaxRate($id_product, null);
        }

        return self::$tax_rate_cache[$id_product];
    }

    protected function getPriceDisplayMethod()
    {
        if (self::$price_display_method === null) {
            self::$price_display_method = Group::getPriceDisplayMethod(Group::getCurrent()->id);
        }

        return self::$price_display_method;
    }

    protected function getPriceRoundMode()
    {
        if (self::$price_round_mode === null) {
            self::$price_round_mode = Configuration::get('PS_PRICE_ROUND_MODE');
        }

        return self::$price_round_mode;
    }
}
