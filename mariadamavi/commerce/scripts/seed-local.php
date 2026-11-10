<?php
if (PHP_SAPI !== 'cli') exit;
$_SERVER['HTTP_HOST']='127.0.0.1:8088'; $_SERVER['REQUEST_URI']='/';
require dirname(__DIR__).'/.local/wordpress/wp-load.php';
if(wp_get_environment_type()!=='local') throw new RuntimeException('Somente local.');
require_once ABSPATH.'wp-admin/includes/image.php';
require_once ABSPATH.'wp-admin/includes/file.php';
require_once ABSPATH.'wp-admin/includes/media.php';
switch_theme('mariadamavi-store');
update_option('woocommerce_checkout_privacy_policy_text', 'Demonstração local: utilize apenas dados fictícios. Nenhum pagamento ou e-mail será enviado.');
foreach(['currency'=>'BRL','default_country'=>'BR:RJ','price_decimal_sep'=>',','price_thousand_sep'=>'.','price_num_decimals'=>'2','enable_guest_checkout'=>'yes','enable_signup_and_login_from_checkout'=>'no','calc_taxes'=>'no','coming_soon'=>'no','allow_tracking'=>'no','custom_orders_table_enabled'=>'no'] as $key=>$value) update_option('woocommerce_'.$key,$value);
update_option('woocommerce_bacs_settings',['enabled'=>'yes','title'=>'Pedido de demonstração — sem cobrança','description'=>'Este ambiente serve apenas para testar a loja. Não faça pagamentos.','instructions'=>'Pedido de teste recebido. Nenhum valor será cobrado.']);
foreach(['home'=>['Loja da Mavi',''],'shop'=>['Produtos',''],'cart'=>['Sacola','[woocommerce_cart]'],'checkout'=>['Finalizar pedido','[woocommerce_checkout]'],'myaccount'=>['Minha conta','[woocommerce_my_account]']] as $key=>$page){
 $slug=['home'=>'inicio','shop'=>'produtos','cart'=>'sacola','checkout'=>'finalizar','myaccount'=>'minha-conta'][$key];
 $existing=get_page_by_path($slug); $id=$existing?$existing->ID:wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_title'=>$page[0],'post_name'=>$slug,'post_content'=>$page[1]]);
 if($key==='home'){update_option('show_on_front','page');update_option('page_on_front',$id);} else update_option('woocommerce_'.$key.'_page_id',$id);
}
$catalog=[['iPhone','iphone',5990],['MacBook','macbook',9990],['iPad','ipad',3990],['Apple Watch','watch',2490],['AirPods','airpods',1490],['iMac','imac',11990],['Mac mini','mac-mini',4990],['Acessórios','acessorios',490]];
foreach($catalog as $order=>$item){
 [$name,$slug,$price]=$item; $sku='DEMO-'.$slug;
 if(wc_get_product_id_by_sku($sku))continue;
 $term=term_exists($name,'product_cat')?:wp_insert_term($name,'product_cat',['slug'=>$slug]);
 $p=$slug==='iphone'?new WC_Product_Variable():new WC_Product_Simple();
 $p->set_name($name.' · exemplo');$p->set_slug($slug.'-demonstracao');$p->set_sku($sku);$p->set_status('publish');$p->set_catalog_visibility('visible');$p->set_category_ids([(int)$term['term_id']]);$p->set_menu_order($order);
 $p->set_description('<p>Produto fictício para demonstrar a experiência da loja. Imagem ilustrativa da categoria Apple: não representa uma configuração disponível para venda.</p><p>Modelo, capacidade, cor, condição, preço, estoque e prazo serão cadastrados com os dados reais antes da abertura da loja.</p>');
 $p->set_short_description('<p><strong>Demonstração — não disponível para compra real.</strong> Preço e configuração ilustrativos. Teste a sacola sem realizar pagamentos.</p>');
 $p->set_weight('1');$p->set_manage_stock(false);
 if($slug==='iphone'){$a=new WC_Product_Attribute();$a->set_name('Capacidade');$a->set_options(['256 GB','512 GB']);$a->set_visible(true);$a->set_variation(true);$p->set_attributes([$a]);}else{$p->set_regular_price((string)$price);}
 if ($slug === 'macbook') {
     $p->set_sale_price('8490');
     $p->set_manage_stock(true);
     $p->set_stock_quantity(2);
     $p->set_low_stock_amount(2);
 }
 $id=$p->save();
 $source=dirname(__DIR__).'/theme/assets/'.$slug.'.webp';$tmp=wp_tempnam($source);copy($source,$tmp);$image=media_handle_sideload(['name'=>$slug.'.webp','tmp_name'=>$tmp],0,'Imagem ilustrativa de '.$name);
 if(!is_wp_error($image)){$p->set_image_id($image);update_post_meta($image,'_wp_attachment_image_alt',$name.' — imagem ilustrativa');$p->save();}
 if($slug==='iphone'){foreach(['256 GB'=>5990,'512 GB'=>6990] as $capacity=>$value){$v=new WC_Product_Variation();$v->set_parent_id($id);$v->set_attributes(['capacidade'=>$capacity]);$v->set_regular_price((string)$value);$v->set_status('publish');$v->save();}WC_Product_Variable::sync($id);}
}
if(!get_option('mavi_demo_shipping')){$zone=new WC_Shipping_Zone();$zone->set_zone_name('Brasil — demonstração');$zone->add_location('BR','country');$zone->save();$instance=$zone->add_shipping_method('flat_rate');update_option('woocommerce_flat_rate_'.$instance.'_settings',['title'=>'Frete de demonstração','tax_status'=>'none','cost'=>'19.90']);update_option('mavi_demo_shipping',true);}
global $wp_rewrite;$wp_rewrite->set_permalink_structure('/%postname%/');flush_rewrite_rules(false);
echo "Tema, catálogo demonstrativo, páginas e checkout configurados.\n";
