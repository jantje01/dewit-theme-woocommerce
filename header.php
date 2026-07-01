<?php
/**
 * The header for the theme.
 *
 * @package DewitTheme
 */

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="format-detection" content="telephone=no">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'dewit-theme-woocommerce' ); ?></a>

<header class="site-header">
	<div class="container site-header__inner">
		<div class="site-branding">
			<?php
			if ( has_custom_logo() ) {
				the_custom_logo();
			} else {
				?>
				<a class="site-title" href="<?php echo esc_url( dewit_theme_get_default_shop_url() ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
				<?php
			}
			?>
		</div>

		<button class="menu-toggle" type="button" aria-controls="primary-menu" aria-expanded="false">
			<span class="menu-toggle__bar"></span>
			<span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'dewit-theme-woocommerce' ); ?></span>
		</button>

		<nav class="main-navigation" aria-label="<?php esc_attr_e( 'Primary menu', 'dewit-theme-woocommerce' ); ?>">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'menu_id'        => 'primary-menu',
				'container'      => false,
				'fallback_cb'    => false,
			) );
			?>
		</nav>

		<?php if ( class_exists( 'WooCommerce' ) ) : ?>
			<a class="header-cart" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="<?php esc_attr_e( 'View cart', 'dewit-theme-woocommerce' ); ?>">
				<?php esc_html_e( 'Cart', 'dewit-theme-woocommerce' ); ?>
				<span class="header-cart__count"><?php echo esc_html( WC()->cart ? WC()->cart->get_cart_contents_count() : 0 ); ?></span>
			</a>
		<?php endif; ?>
	</div>
</header>
