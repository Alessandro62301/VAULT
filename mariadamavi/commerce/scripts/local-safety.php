<?php
/** Plugin Name: Mavi local — demonstração sem cobrança ou e-mail */
if (!defined('ABSPATH')) exit;
if (wp_get_environment_type() !== 'local') return;
if (!defined('WP_ACCESSIBLE_HOSTS')) define('WP_ACCESSIBLE_HOSTS', 'api.mercadopago.com');
// Pedidos de teste não devem enviar mensagens a clientes nem a administradores.
add_filter('pre_wp_mail', '__return_true');
add_filter('woocommerce_allow_tracking', '__return_false');
add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    $checkout_pro = 'woo-mercado-pago-basic';
    $mercado_pago = $GLOBALS['mercadopago'] ?? null;
    if (isset($gateways[$checkout_pro]) && $mercado_pago && $mercado_pago->storeConfig->isTestMode()) {
        return [$checkout_pro => $gateways[$checkout_pro]];
    }
    if (isset($gateways['mavi_whatsapp'])) return ['mavi_whatsapp'=>$gateways['mavi_whatsapp']];
    return isset($gateways['bacs']) ? ['bacs' => $gateways['bacs']] : [];
});
add_action('wp_body_open', function () {
    echo '<div class="mavi-demo" role="note">PRÉVIA LOCAL · Produtos, preços e frete ilustrativos · Nenhuma cobrança é realizada</div>';
});
add_action('send_headers', function () { header('X-Robots-Tag: noindex, nofollow'); });
