<?php defined('ABSPATH') || exit; get_header(); ?>
<main id="main" class="site-main">
<section class="mavi-store-hero"><div><span class="mavi-eyebrow">BEM-VINDO À LOJA DA MAVI</span><h1>Seu próximo<br>Apple começa<br><em>por aqui.</em></h1><p>Escolha no seu tempo. Se pintar uma dúvida,<br>a Maria está a uma mensagem de distância.</p><a class="button" href="#vitrine">Encontrar meu Apple ↓</a></div><div class="mavi-hero-product"><span>FEITO PARA A SUA ROTINA.</span><img src="<?php echo esc_url(get_stylesheet_directory_uri().'/assets/macbook.webp'); ?>" alt="MacBook aberto, imagem ilustrativa" fetchpriority="high"><p>Para criar. Trabalhar. Ir além.</p></div></section>
<section class="mavi-highlights" aria-label="Explore a loja da Mavi">
  <article class="mavi-highlight mavi-highlight-iphone">
    <div><span class="mavi-eyebrow">IPHONE NO DIA A DIA</span><h2>Seu mundo.<br>Com outro olhar.</h2><p>Fotos, trabalho e tudo o que acompanha você.</p><a class="mavi-banner-link" href="<?php echo esc_url(home_url('/product-category/iphone/')); ?>">Explorar iPhones <span aria-hidden="true">↗</span></a></div>
    <img src="<?php echo esc_url(get_stylesheet_directory_uri().'/assets/iphone.webp'); ?>" alt="iPhone, imagem ilustrativa da categoria" width="340" height="420" loading="lazy">
  </article>
  <article class="mavi-highlight mavi-highlight-mac">
    <span class="mavi-eyebrow">MACBOOK SOB MEDIDA</span><h2>Seu trabalho pede<br>uma configuração<br><em>fora do comum?</em></h2><p>Memória, armazenamento, Pro ou Max. <br>A Maria te ajuda a montar a escolha.</p><a class="mavi-banner-link" href="<?php echo esc_url('https://wa.me/5521920184210?text='.rawurlencode('Oi, Maria! Vim pela loja e quero ajuda para configurar um MacBook sob medida.')); ?>">Montar com a Maria <span aria-hidden="true">↗</span></a>
    <div class="mavi-spec-tags" aria-hidden="true"><span>PRO / MAX</span><span>MEMÓRIA</span><span>SSD</span></div>
  </article>
</section>
<div class="mavi-trust"><span><strong>500+</strong> pedidos entregues</span><span>↗ Atendimento direto com a Maria</span><span>✓ Nota fiscal e garantia</span></div>
<section id="vitrine" class="mavi-showcase"><div class="mavi-section-title"><div><span class="mavi-eyebrow">ENCONTRE O SEU</span><h2>Qual vai com você?</h2></div><a href="<?php echo esc_url(wc_get_page_permalink('shop')); ?>">Ver todos os produtos ↗</a></div>
<?php echo do_shortcode('[products limit="8" columns="4" orderby="menu_order" order="ASC"]'); ?>
</section>
<section class="mavi-bag-story" aria-labelledby="mavi-bag-title">
  <div class="mavi-bag-photo"><img src="<?php echo esc_url(get_stylesheet_directory_uri().'/assets/mavibag.jpg'); ?>" alt="MaviBag real com embalagem rosa e cartão de boas-vindas" width="900" height="864" loading="lazy"><span>EMBALADO POR GENTE DE VERDADE.</span></div>
  <div class="mavi-bag-copy"><span class="mavi-eyebrow">O CUIDADO TAMBÉM VAI NA SACOLA</span><h2 id="mavi-bag-title">Antes de ser seu,<br>passa pelas<br><em>nossas mãos.</em></h2><p>Tem escolha, conversa e carinho em cada pedido. A MaviBag é o nosso jeito de fazer o seu Apple chegar com um pouco da gente.</p><a class="mavi-banner-link" href="<?php echo esc_url('https://wa.me/5521920184210?text='.rawurlencode('Oi, Maria! Vi a MaviBag na loja e quero saber mais sobre a entrega do meu Apple.')); ?>">Falar sobre meu pedido <span aria-hidden="true">↗</span></a><small>Foto real da nossa embalagem. Consulte as condições atuais com a Maria.</small></div>
</section>
<section class="mavi-shopping-guide" aria-labelledby="mavi-guide-title"><div class="mavi-section-title"><div><span class="mavi-eyebrow">DA ESCOLHA AO UNBOXING</span><h2 id="mavi-guide-title">Pode comprar com calma.</h2></div></div>
<div class="mavi-guide-grid"><article><span class="mavi-guide-number">01 / ESCOLHA</span><h3>O Apple que combina com você.</h3><p>Explore as categorias e confira a configuração. Ficou entre dois modelos? Chama a Maria.</p></article><article><span class="mavi-guide-number">02 / COMBINE</span><h3>Os detalhes vêm primeiro.</h3><p>Confira condição, garantia e prazo antes de fechar. Encomendas têm prazo de 2 a 14 dias úteis.</p></article><article><span class="mavi-guide-number">03 / RECEBA</span><h3>O cuidado continua depois.</h3><p>Nota fiscal, contrato e acompanhamento. E a Maria por perto quando precisar de ajuda.</p></article></div>
</section>
</main><?php get_footer(); ?>
