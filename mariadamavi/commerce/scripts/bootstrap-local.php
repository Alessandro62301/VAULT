<?php
// Instala somente uma nova demonstração local. Nunca use este script em produção.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
$root = dirname(__DIR__) . '/.local/wordpress';
if (!is_file($root . '/wp-load.php')) { throw new RuntimeException('Baixe WordPress antes de instalar.'); }
if (!is_file($root . '/wp-config.php')) {
    $settings = [
        'DB_NAME' => 'mavi_demo', 'DB_USER' => 'local', 'DB_PASSWORD' => '', 'DB_HOST' => 'localhost',
        'DB_CHARSET' => 'utf8mb4', 'DB_COLLATE' => '', 'DB_ENGINE' => 'sqlite',
        'WP_HOME' => 'http://127.0.0.1:8088', 'WP_SITEURL' => 'http://127.0.0.1:8088',
        'WP_ENVIRONMENT_TYPE' => 'local', 'WP_DEBUG' => false, 'DISABLE_WP_CRON' => true,
        'WP_HTTP_BLOCK_EXTERNAL' => true, 'AUTOMATIC_UPDATER_DISABLED' => true,
        'WP_MEMORY_LIMIT' => '256M', 'DISALLOW_FILE_EDIT' => true,
    ];
    foreach (['AUTH_KEY','SECURE_AUTH_KEY','LOGGED_IN_KEY','NONCE_KEY','AUTH_SALT','SECURE_AUTH_SALT','LOGGED_IN_SALT','NONCE_SALT'] as $key) {
        $settings[$key] = bin2hex(random_bytes(32));
    }
    $config = "<?php\n";
    foreach ($settings as $key => $value) { $config .= 'define(' . var_export($key, true) . ', ' . var_export($value, true) . ");\n"; }
    $config .= "\$table_prefix = 'mavi_';\nif (!defined('ABSPATH')) define('ABSPATH', __DIR__ . '/');\nrequire_once ABSPATH . 'wp-settings.php';\n";
    file_put_contents($root . '/wp-config.php', $config);
}
copy($root . '/wp-content/plugins/sqlite-database-integration/db.copy', $root . '/wp-content/db.php');
if (!is_dir($root . '/wp-content/mu-plugins')) mkdir($root . '/wp-content/mu-plugins', 0775, true);
copy(__DIR__ . '/local-safety.php', $root . '/wp-content/mu-plugins/mavi-local-safety.php');
define('WP_INSTALLING', true);
$_SERVER['HTTP_HOST'] = '127.0.0.1:8088';
$_SERVER['REQUEST_URI'] = '/';
require $root . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
if (!is_blog_installed()) {
    $password = bin2hex(random_bytes(18));
    $result = wp_install('mariadamavi · loja', 'mavi-local-admin', 'admin@example.test', false, '', $password, 'pt_BR');
    if (is_wp_error($result)) throw new RuntimeException($result->get_error_message());
    file_put_contents(dirname(__DIR__) . '/.local/access.json', json_encode([
        'url' => 'http://127.0.0.1:8088/wp-admin/', 'username' => 'mavi-local-admin', 'password' => $password,
        'notice' => 'Somente demonstração local. Não usar estas credenciais em produção.',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
require_once ABSPATH . 'wp-admin/includes/plugin.php';
wp_cache_delete('plugins', 'plugins');
$result = activate_plugin('woocommerce/woocommerce.php', '', false, true);
if (is_wp_error($result)) throw new RuntimeException($result->get_error_message());
WC_Install::install();
update_option('WPLANG', 'pt_BR');
update_option('blog_public', '0');
update_option('woocommerce_allow_tracking', 'no');
update_option('woocommerce_coming_soon', 'no');
echo "WordPress local instalado e WooCommerce ativado. Credenciais em commerce/.local/access.json (ignorado pelo Git).\n";
