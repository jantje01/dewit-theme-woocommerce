<?php
/**
 * Single product template.
 *
 * @package DewitTheme
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<main id="primary" class="site-main dewit-product-page">
	<div class="container dewit-product-page__inner">
		<?php
		while ( have_posts() ) :
			the_post();

			global $product;

			if ( ! $product instanceof WC_Product ) {
				$product = wc_get_product( get_the_ID() );
			}

			$shop_url = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/?post_type=product' );
			?>

			<nav class="dewit-product-breadcrumb" aria-label="<?php esc_attr_e( 'Product navigatie', 'dewit-theme-woocommerce' ); ?>">
				<a href="<?php echo esc_url( $shop_url ); ?>"><?php esc_html_e( 'Terug naar assortiment', 'dewit-theme-woocommerce' ); ?></a>
			</nav>

			<?php wc_print_notices(); ?>

			<article id="product-<?php the_ID(); ?>" <?php wc_product_class( 'dewit-product', $product ); ?>>
				<section class="dewit-product-hero">
					<div class="dewit-product-gallery">
						<?php woocommerce_show_product_images(); ?>
					</div>

					<div class="dewit-product-summary">
						<?php if ( $product && $product->get_sku() ) : ?>
							<p class="dewit-product-sku">
								<?php esc_html_e( 'Artikelnummer', 'dewit-theme-woocommerce' ); ?>
								<span><?php echo esc_html( $product->get_sku() ); ?></span>
							</p>
						<?php endif; ?>

						<?php woocommerce_template_single_title(); ?>

						<?php if ( $product ) : ?>
							<div class="dewit-product-meta">
								<?php echo wc_get_product_category_list( $product->get_id(), ', ', '<span>', '</span>' ); ?>
							</div>
						<?php endif; ?>

						<?php woocommerce_template_single_excerpt(); ?>

						<div class="dewit-product-actions">
							<?php woocommerce_template_single_add_to_cart(); ?>
							<a class="dewit-product-phone" href="tel:+31412634969"><?php esc_html_e( 'Bel 0412 - 63 49 69', 'dewit-theme-woocommerce' ); ?></a>
						</div>
					</div>
				</section>

				<section class="dewit-product-details">
					<?php woocommerce_output_product_data_tabs(); ?>
				</section>

				<?php
				woocommerce_output_related_products(
					array(
						'posts_per_page' => 4,
						'columns'        => 4,
					)
				);
				?>
			</article>
		<?php endwhile; ?>
	</div>
</main>

<?php
get_footer();
