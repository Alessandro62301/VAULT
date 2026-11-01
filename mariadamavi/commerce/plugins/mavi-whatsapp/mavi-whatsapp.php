<?php
/**
 * Plugin Name: Mavi — finalizar pelo WhatsApp
 * Description: Registra o pedido sem cobrança e abre a conversa com a Maria.
 * Version: 1.0.0
 * Requires Plugins: woocommerce
 */
defined('ABSPATH') || exit;

add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) return;
    class Mavi_WhatsApp_Gateway extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'mavi_whatsapp';
            $this->method_title = 'Finalizar com a Maria pelo WhatsApp';
            $this->method_description = 'Modo temporário: pedidos sem pagamento online. Desative este método ao ativar PIX/cartão.';
            $this->has_fields = false;
            $this->supports = ['products'];
            $this->form_fields = ['enabled'=>['title'=>'Ativar','type'=>'checkbox','label'=>'Finalizar pedidos exclusivamente pelo WhatsApp','default'=>'no']];
            $this->init_settings();
            $this->enabled = $this->get_option('enabled', 'no');
            $this->title = 'Combinar pagamento com a Maria';
            $this->description = 'Ao finalizar, seu pedido fica registrado e o WhatsApp abre com os produtos e o total. Toque em Enviar na conversa para falar com a Maria. Nenhum pagamento é feito aqui; disponibilidade, frete e pagamento serão confirmados no atendimento.';
            $this->order_button_text = 'Finalizar pelo WhatsApp';
            add_action('woocommerce_update_options_payment_gateways_'.$this->id, [$this,'process_admin_options']);
            add_action('woocommerce_thankyou_'.$this->id, [$this,'thankyou']);
        }
        public static function message($order) {
            $money = function ($value) use ($order) {
                return html_entity_decode(wp_strip_all_tags(wc_price($value, ['currency'=>$order->get_currency()])), ENT_QUOTES, 'UTF-8');
            };
            $lines = ['Oi, Maria! Quero finalizar meu pedido #'.$order->get_order_number().'.'];
            if (wp_get_environment_type() === 'local') $lines[] = '[DEMONSTRAÇÃO — produtos, preços e frete ilustrativos]';
            $lines[] = '';
            foreach ($order->get_items() as $item) {
                $lines[] = $item->get_quantity().' × '.$item->get_name().' — '.$money($item->get_total()+$item->get_total_tax());
                foreach ($item->get_formatted_meta_data() as $meta) {
                    $lines[] = '  '.wp_strip_all_tags($meta->display_key).': '.html_entity_decode(wp_strip_all_tags($meta->display_value), ENT_QUOTES, 'UTF-8');
                }
            }
            $lines[] = '';
            $lines[] = 'Frete estimado: '.$money($order->get_shipping_total()+$order->get_shipping_tax());
            $lines[] = 'Total do pedido: '.$money($order->get_total());
            $lines[] = 'Pode confirmar a disponibilidade, a entrega e as opções de pagamento?';
            // No address, email, phone, order key or private customer notes in the URL.
            return implode("\n", $lines);
        }
        public static function link($order) {
            $message = self::message($order);
            // Keep large carts within practical click-to-chat URL limits.
            if (strlen(rawurlencode($message)) > 6000) {
                $message = 'Oi, Maria! Quero finalizar meu pedido #'.$order->get_order_number().' ('.$order->get_item_count().' itens). Pode consultar os detalhes na loja e confirmar entrega e pagamento?';
                if (wp_get_environment_type() === 'local') $message .= ' Pedido de demonstração, sem cobrança.';
            }
            return 'https://wa.me/5521920184210?text='.rawurlencode($message);
        }
        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            if (!$order) return ['result'=>'failure'];
            $order->update_status('on-hold', 'Aguardando contato e confirmação pelo WhatsApp. Nenhum pagamento online realizado.');
            if (WC()->cart && $order->has_cart_hash(WC()->cart->get_cart_hash())) WC()->cart->empty_cart();
            return ['result'=>'success', 'redirect'=>self::link($order)];
        }
        public function thankyou($order_id) {
            $order = wc_get_order($order_id);
            if (!$order) return;
            echo '<p>Seu pedido aguarda confirmação com a Maria. Nenhum pagamento foi realizado.</p><p><a class="button" href="'.esc_url(self::link($order)).'">Continuar no WhatsApp ↗</a></p>';
        }
    }
    add_filter('woocommerce_payment_gateways', function ($gateways) { $gateways[] = 'Mavi_WhatsApp_Gateway'; return $gateways; });
}, 20);

add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    return isset($gateways['mavi_whatsapp']) ? ['mavi_whatsapp'=>$gateways['mavi_whatsapp']] : $gateways;
}, 100);
