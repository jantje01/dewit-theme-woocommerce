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
					<a class="dewit-sidebar-logo-link" href="<?php echo esc_url( dewit_theme_get_default_shop_url() ); ?>" aria-label="<?php esc_attr_e( 'Terug naar hoofdcategorieën', 'dewit-theme-woocommerce' ); ?>">
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
			$product_description = $product ? apply_filters( 'the_content', $product->get_description() ) : '';
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

							<?php if ( '' !== trim( wp_strip_all_tags( $product_description ) ) ) : ?>
								<div class="dewit-product-description">
									<?php echo $product_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</div>
							<?php else : ?>
								<?php woocommerce_template_single_excerpt(); ?>
							<?php endif; ?>

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
				if ( $product instanceof WC_Product ) {
					echo dewit_theme_render_product_category_options_table( $product ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				}
				?>
			</article>
		<?php endwhile; ?>
	</div>
</main>
