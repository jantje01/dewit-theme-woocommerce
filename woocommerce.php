<?php
/**
 * WooCommerce template bridge.
 *
 * @package DewitTheme
 */

get_header();

if ( is_product() ) {
	get_template_part( 'template-parts/content', 'product-single' );
} else {
	woocommerce_content();
}

get_footer();
