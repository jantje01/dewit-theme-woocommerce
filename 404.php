<?php
/**
 * 404 template.
 *
 * @package DewitTheme
 */

get_header();
?>

<main id="primary" class="site-main">
	<section class="container not-found">
		<h1><?php esc_html_e( 'Page not found', 'dewit-theme-woocommerce' ); ?></h1>
		<p><?php esc_html_e( 'The page you are looking for does not exist or has moved.', 'dewit-theme-woocommerce' ); ?></p>
		<?php get_search_form(); ?>
	</section>
</main>

<?php
get_footer();
