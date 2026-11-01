<?php
// Roteador do servidor PHP local. O servidor deve escutar apenas em 127.0.0.1.
$root = realpath(__DIR__ . '/../.local/wordpress');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (preg_match('~(?:/\.|/wp-content/database/|/wp-config\.php|\.(?:sqlite|sqlite3|db|log)$)~i', $path)) { http_response_code(403); exit; }
$file = realpath($root . $path);
if ($file && str_starts_with($file, $root . DIRECTORY_SEPARATOR) && is_file($file)) return false;
require $root . '/index.php';
