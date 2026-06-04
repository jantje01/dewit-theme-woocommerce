<?php
/**
 * Product detail page content.
 *
 * @package DewitTheme
 */

defined( 'ABSPATH' ) || exit;
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

			$back_link = dewit_theme_get_product_back_link( $product );
			?>

			<nav class="dewit-product-breadcrumb" aria-label="<?php esc_attr_e( 'Product navigatie', 'dewit-theme-woocommerce' ); ?>">
				<a href="<?php echo esc_url( $back_link['url'] ); ?>"><?php echo esc_html( $back_link['label'] ); ?></a>
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
							<a class="dewit-product-phone" href="tel:+31412634969"><?php esc_html_e( 'Bel 0412 - 63 49 69', 'dewit-theme-woocommerce' ); ?></a>
							<a class="dewit-product-mail" href="mailto:info@dewitbouwmachines.nl"><?php esc_html_e( 'Mail ons', 'dewit-theme-woocommerce' ); ?></a>
						</div>
					</div>
				</section>

				<?php
				$product_tabs = apply_filters( 'woocommerce_product_tabs', array() );

				if ( ! empty( $product_tabs ) ) :
					?>
					<section class="dewit-product-details">
						<?php woocommerce_output_product_data_tabs(); ?>
					</section>
				<?php endif; ?>

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
