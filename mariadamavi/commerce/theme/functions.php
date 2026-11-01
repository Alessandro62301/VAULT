<?php
defined('ABSPATH') || exit;
add_action('after_setup_theme', function () {
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-slider');
    add_theme_support('wc-product-gallery-lightbox');
});
add_action('wp', function () {
    remove_action('storefront_sidebar', 'storefront_get_sidebar', 10);
    remove_action('storefront_before_content', 'woocommerce_breadcrumb', 10);
    remove_action('storefront_after_footer', 'storefront_handheld_footer_bar', 999);
});
add_action('wp_enqueue_scripts', function () {
    wp_dequeue_style('storefront-fonts');
    wp_dequeue_style('source-sans-pro');
    if (is_front_page()) wp_enqueue_style('mavi-home', get_stylesheet_directory_uri().'/home.css', ['storefront-child-style'], filemtime(get_stylesheet_directory().'/home.css'));
    wp_enqueue_style('mavi-controls', get_stylesheet_directory_uri().'/controls.css', ['storefront-child-style'], filemtime(get_stylesheet_directory().'/controls.css'));
    wp_enqueue_script('mavi-controls', get_stylesheet_directory_uri().'/controls.js', ['jquery','wc-add-to-cart-variation'], filemtime(get_stylesheet_directory().'/controls.js'), true);
}, 100);
// Use the original aspect ratio instead of WooCommerce's cropped square thumbnail.
add_filter('single_product_archive_thumbnail_size', fn() => 'medium_large');
add_action('woocommerce_before_shop_loop_item_title', function () { echo '<div class="mavi-product-picture">'; }, 5);
add_action('woocommerce_before_shop_loop_item_title', function () { echo '<span class="mavi-picture-hint" aria-hidden="true">Conhecer ↗</span></div>'; }, 15);
add_filter('loop_shop_columns', fn() => 4);
add_filter('loop_shop_per_page', fn() => 12);
function mavi_wa() { return 'https://wa.me/5521920184210?text=' . rawurlencode('Oi, Maria! Estou na loja e queria ajuda para escolher meu Apple.'); }
function mavi_landing() { return wp_get_environment_type() === 'local' ? 'http://127.0.0.1:5173/' : 'https://mariadamavi.com.br/'; }
function mavi_cart_link() {
    if (!function_exists('WC')) return;
    $count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
    echo '<a class="mavi-cart" href="' . esc_url(wc_get_cart_url()) . '">Sacola <span>' . esc_html($count) . '</span></a>';
}
add_filter('woocommerce_add_to_cart_fragments', function ($fragments) {
    ob_start(); mavi_cart_link(); $fragments['a.mavi-cart'] = ob_get_clean(); return $fragments;
});
