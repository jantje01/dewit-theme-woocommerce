<?php
/**
 * Product detail page content.
 *
 * @package DewitTheme
 */

defined( 'ABSPATH' ) || exit;
?>

<main id="primary" class="site-main dewit-product-page">
	<aside id="catalog-sidebar" class="shop-sidebar">
		<?php if ( is_active_sidebar( 'shop-sidebar' ) ) : ?>
			<?php dynamic_sidebar( 'shop-sidebar' ); ?>
		<?php else : ?>
			<div class="elementor-element elementor-element-c6a068a e-con-full e-flex e-con e-child">
				<div class="elementor-element elementor-element-aad6506 elementor-widget elementor-widget-image">
					<a class="dewit-sidebar-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'Terug naar hoofdcategorieën', 'dewit-theme-woocommerce' ); ?>">
						<?php
						$custom_logo_id = (int) get_theme_mod( 'custom_logo' );

						if ( $custom_logo_id ) {
							echo wp_get_attachment_image( $custom_logo_id, 'large' );
						} else {
							bloginfo( 'name' );
						}
						?>
					</a>
				</div>
			</div>

			<div class="elementor-element elementor-element-cdaf430 e-con-full e-flex e-con e-child">
				<div class="elementor-element elementor-element-da631c6 elementor-widget elementor-widget-heading">
					<h2 class="elementor-heading-title elementor-size-default"><?php esc_html_e( 'Categorieën', 'dewit-theme-woocommerce' ); ?></h2>
				</div>
				<div class="elementor-element elementor-element-3689aa1 elementor-widget elementor-widget-taxonomy-filter">
					<search class="e-filter" role="search"></search>
				</div>
			</div>
		<?php endif; ?>
	</aside>

	<div class="container dewit-product-page__inner">
		<?php
		while ( have_posts() ) :
			the_post();

			global $product;

			if ( ! $product instanceof WC_Product ) {
				$product = wc_get_product( get_the_ID() );
			}

			$back_link = dewit_theme_get_product_back_link( $product );
			$product_resources = dewit_theme_get_product_resources( $product );
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
						<div class="dewit-product-summary__content">
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

							<?php if ( ! empty( $product_resources ) ) : ?>
								<div class="dewit-product-resources" aria-label="<?php esc_attr_e( 'Productinformatie', 'dewit-theme-woocommerce' ); ?>">
									<p><?php esc_html_e( 'Productinformatie', 'dewit-theme-woocommerce' ); ?></p>
									<div class="dewit-product-resources__links">
										<?php foreach ( $product_resources as $resource ) : ?>
											<a class="dewit-product-resource dewit-product-resource--<?php echo esc_attr( $resource['type'] ); ?>" href="<?php echo esc_url( $resource['url'] ); ?>" target="_blank" rel="noopener">
												<?php echo esc_html( $resource['label'] ); ?>
											</a>
										<?php endforeach; ?>
									</div>
								</div>
							<?php endif; ?>
						</div>

						<div class="dewit-product-actions">
							<p class="dewit-product-actions__label"><?php esc_html_e( 'Direct contact', 'dewit-theme-woocommerce' ); ?></p>
							<a class="dewit-product-phone" href="tel:+31412634969">
								<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z"></path>
								</svg>
								<span><?php esc_html_e( '0412 - 63 49 69', 'dewit-theme-woocommerce' ); ?></span>
							</a>
							<a class="dewit-product-mail" href="mailto:info@dewitbouwmachines.nl">
								<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="m22 7-8.99 5.72a2 2 0 0 1-2.02 0L2 7"></path>
									<rect width="20" height="16" x="2" y="4" rx="2"></rect>
								</svg>
								<span><?php esc_html_e( 'Mail ons', 'dewit-theme-woocommerce' ); ?></span>
							</a>
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
