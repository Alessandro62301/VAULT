<?php
if (PHP_SAPI !== 'cli') exit;
require dirname(__DIR__).'/.local/wordpress/wp-load.php';
if (wp_get_environment_type() !== 'local') throw new RuntimeException('Somente local.');
function mavi_check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
$order = wc_create_order();
try {
    $parent = wc_get_product(wc_get_product_id_by_sku('DEMO-iphone'));
    $product = wc_get_product($parent->get_children()[0]);
    $order->add_product($product, 2);
    $order->set_billing_email('teste-privado@example.test');
    $order->set_billing_address_1('Endereco privado de teste');
    $order->set_payment_method('mavi_whatsapp');
    $order->calculate_totals();
    $gateway = new Mavi_WhatsApp_Gateway();
    $result = $gateway->process_payment($order->get_id());
    $saved = wc_get_order($order->get_id());
    mavi_check($result['result']==='success', 'Falha ao finalizar.');
    mavi_check($saved->get_status()==='on-hold' && !$saved->is_paid(), 'Pedido não pode estar pago.');
    mavi_check(str_starts_with($result['redirect'], 'https://wa.me/5521920184210?text='), 'Destino errado.');
    $message = rawurldecode(explode('?text=', $result['redirect'], 2)[1]);
    mavi_check(str_contains($message, '2 × iPhone') && str_contains($message, '256 GB'), 'Itens ou variação ausentes.');
    mavi_check(str_contains($message, '11.980,00'), 'Total incorreto.');
    mavi_check(!str_contains($message, 'teste-privado') && !str_contains($message, 'Endereco privado') && !str_contains($message, $order->get_order_key()), 'Dados privados expostos.');
    mavi_check(str_contains($message, 'DEMONSTRAÇÃO'), 'Aviso de demonstração ausente.');
    echo "OK: destino, variação, quantidade, total, status não pago e privacidade. Nenhuma mensagem enviada.\n";
} finally {
    $order->update_status('cancelled', 'Teste automatizado local encerrado; nenhuma mensagem enviada.');
}
