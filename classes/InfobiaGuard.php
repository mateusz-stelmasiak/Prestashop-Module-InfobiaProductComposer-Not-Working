<?php
/**
 * Access checks for the composer's standalone scripts.
 *
 * The scripts under ajax/ and controllers/front/ajax_module.php bootstrap
 * PrestaShop themselves and are reachable by URL, so the router's own
 * employee check never runs for them. They back the configuration screens
 * only, so each one now asks for a logged-in employee before doing anything.
 */
class InfobiaGuard
{
    /**
     * Stops the request with 403 unless the psAdmin cookie belongs to an
     * active employee. Same test as Employee::isLoggedBack(), read from the
     * back-office cookie rather than the front context the script booted with.
     * The cookie is scoped to the shop root, so it reaches /modules/ URLs.
     */
    public static function requireEmployee()
    {
        $lifetime = (int)Configuration::get('PS_COOKIE_LIFETIME_BO');
        if ($lifetime > 0) {
            $lifetime = time() + (max($lifetime, 1) * 3600);
        }
        $force_ssl = Configuration::get('PS_SSL_ENABLED') && Configuration::get('PS_SSL_ENABLED_EVERYWHERE');
        $cookie = new Cookie('psAdmin', '', $lifetime, null, false, $force_ssl);

        $id_employee = (int)$cookie->id_employee;
        $allowed = $id_employee > 0
            && Employee::checkPassword($id_employee, (string)$cookie->passwd);

        if ($allowed && Configuration::get('PS_COOKIE_CHECKIP') && isset($cookie->remote_addr)) {
            $allowed = (int)$cookie->remote_addr === (int)ip2long(Tools::getRemoteAddr());
        }

        if (!$allowed) {
            header('HTTP/1.1 403 Forbidden');
            header('Content-Type: text/plain; charset=utf-8');
            die('Forbidden');
        }
    }
}
