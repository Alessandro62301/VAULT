<?php defined('ABSPATH') || exit; $search_id = wp_unique_id('mavi-search-'); ?>
<form role="search" method="get" class="woocommerce-product-search" action="<?php echo esc_url(home_url('/')); ?>" autocomplete="off">
<label class="screen-reader-text" for="<?php echo esc_attr($search_id); ?>">Pesquisar produtos</label>
<svg class="mavi-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
<input type="search" id="<?php echo esc_attr($search_id); ?>" class="search-field" placeholder="Qual Apple você procura?" value="<?php echo get_search_query(); ?>" name="s" autocomplete="off">
<button type="submit">Pesquisar</button><input type="hidden" name="post_type" value="product">
</form>
