<?php defined('ABSPATH') || exit; ?><!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class(); ?>><?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#content">Pular para o conteúdo</a>
<div id="page" class="site">
<div class="mavi-top">Apple com procedência. Atendimento com a Maria. <a href="<?php echo esc_url(mavi_wa()); ?>">Vamos conversar ↗</a></div>
<header class="mavi-header"><div class="col-full mavi-header-row">
<a class="mavi-brand" href="<?php echo esc_url(home_url('/')); ?>" aria-label="mariadamavi — início">mariadamavi<span>apple, do seu jeito.</span></a>
<div class="mavi-search"><?php if (function_exists('get_product_search_form')) get_product_search_form(); ?></div>
<a class="mavi-help" href="<?php echo esc_url(mavi_wa()); ?>">Fale com a Maria ↗</a>
<?php mavi_cart_link(); ?></div>
<nav class="mavi-categories col-full" aria-label="Categorias da loja">
<a href="<?php echo esc_url(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/')); ?>">Todos os produtos</a>
<?php foreach (get_terms(['taxonomy'=>'product_cat','hide_empty'=>true,'exclude'=>[get_option('default_product_cat')]]) as $term): ?>
<a href="<?php echo esc_url(get_term_link($term)); ?>"><?php echo esc_html($term->name); ?></a>
<?php endforeach; ?></nav></header>
<div id="content" class="site-content" tabindex="-1"><div class="col-full"><?php do_action('storefront_content_top'); ?>
