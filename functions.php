<?php
/**
 * De Wit Theme WooCommerce functions and definitions.
 *
 * @package DewitTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DEWIT_THEME_VERSION', '0.3.36' );
define( 'DEWIT_DEFAULT_PARENT_CATEGORY_SLUG', 'steigermateriaal' );
define( 'DEWIT_TEMPORARY_LANDING_PARENT_CATEGORY_SLUG', 'afstandhouders' );

if ( ! function_exists( 'dewit_theme_setup' ) ) {
	/**
	 * Set up theme defaults and supported WordPress features.
	 */
	function dewit_theme_setup(): void {
		load_theme_textdomain( 'dewit-theme-woocommerce', get_template_directory() . '/languages' );

		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'custom-logo', array(
			'height'      => 80,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		) );
		add_theme_support( 'html5', array(
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
			'navigation-widgets',
		) );
		add_theme_support( 'align-wide' );
		add_theme_support( 'editor-styles' );
		add_editor_style( 'assets/css/theme.css' );

		add_theme_support( 'woocommerce' );
		add_theme_support( 'wc-product-gallery-zoom' );
		add_theme_support( 'wc-product-gallery-lightbox' );
		add_theme_support( 'wc-product-gallery-slider' );

		register_nav_menus( array(
			'primary' => __( 'Primary Menu', 'dewit-theme-woocommerce' ),
			'footer'  => __( 'Footer Menu', 'dewit-theme-woocommerce' ),
		) );
	}
}
add_action( 'after_setup_theme', 'dewit_theme_setup' );

/**
 * Set content width for embeds.
 */
function dewit_theme_content_width(): void {
	$GLOBALS['content_width'] = apply_filters( 'dewit_theme_content_width', 1200 );
}
add_action( 'after_setup_theme', 'dewit_theme_content_width', 0 );

/**
 * Register widget areas.
 */
function dewit_theme_widgets_init(): void {
	register_sidebar( array(
		'name'          => __( 'Sidebar', 'dewit-theme-woocommerce' ),
		'id'            => 'sidebar-1',
		'description'   => __( 'Add widgets here.', 'dewit-theme-woocommerce' ),
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	) );

	register_sidebar( array(
		'name'          => __( 'Shop Sidebar', 'dewit-theme-woocommerce' ),
		'id'            => 'shop-sidebar',
		'description'   => __( 'Filters and widgets for WooCommerce shop pages.', 'dewit-theme-woocommerce' ),
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	) );
}
add_action( 'widgets_init', 'dewit_theme_widgets_init' );

/**
 * Return WooCommerce product category image data when a thumbnail is configured.
 *
 * @return array{src:string,width:int,height:int}|null
 */
function dewit_theme_get_product_category_image_data( int $term_id ): ?array {
	$thumbnail_id = absint( get_term_meta( $term_id, 'thumbnail_id', true ) );
	$image_data   = $thumbnail_id ? wp_get_attachment_image_src( $thumbnail_id, 'woocommerce_thumbnail' ) : false;

	if ( ! $image_data ) {
		return null;
	}

	return array(
		'src'    => $image_data[0],
		'width'  => absint( $image_data[1] ),
		'height' => absint( $image_data[2] ),
	);
}

/**
 * Return the WooCommerce placeholder image data for category cards without an image.
 *
 * @return array{src:string,width:int,height:int}
 */
function dewit_theme_get_placeholder_image_data(): array {
	$src = function_exists( 'wc_placeholder_img_src' ) ? wc_placeholder_img_src( 'woocommerce_thumbnail' ) : '';

	return array(
		'src'    => $src,
		'width'  => 300,
		'height' => 300,
	);
}

/**
 * Enqueue scripts and styles.
 */
function dewit_theme_scripts(): void {
	wp_enqueue_style(
		'dewit-theme-woocommerce-style',
		get_template_directory_uri() . '/assets/css/theme.css',
		array(),
		DEWIT_THEME_VERSION
	);

	wp_enqueue_script(
		'dewit-theme-woocommerce-script',
		get_template_directory_uri() . '/assets/js/theme.js',
		array(),
		DEWIT_THEME_VERSION,
		true
	);

	wp_localize_script(
		'dewit-theme-woocommerce-script',
		'dewitTheme',
		array(
			'ajaxUrl'               => admin_url( 'admin-ajax.php' ),
			'defaultParentCategory' => dewit_theme_get_default_parent_category_slug(),
			'logoUrl'               => get_theme_mod( 'custom_logo' ) ? wp_get_attachment_image_url( (int) get_theme_mod( 'custom_logo' ), 'full' ) : '',
			'homeUrl'               => home_url( '/' ),
			'placeholderImage'      => dewit_theme_get_placeholder_image_data(),
		)
	);
	wp_add_inline_script(
		'dewit-theme-woocommerce-script',
		'window.dewitTheme = window.dewitTheme || (typeof dewitTheme !== "undefined" ? dewitTheme : {});',
		'before'
	);

	$parent_slug = dewit_theme_get_current_parent_category_slug();

	if ( '' !== $parent_slug ) {
		$parent_term = get_term_by( 'slug', $parent_slug, 'product_cat' );

		if ( $parent_term instanceof WP_Term ) {
			wp_add_inline_script(
				'dewit-theme-woocommerce-script',
				'window.dewitGroupedCategory = ' . wp_json_encode( array(
					'label' => $parent_term->name,
					'slug'  => $parent_slug,
					'html'  => dewit_theme_render_grouped_category_products_html( $parent_slug ),
				) ) . ';',
				'before'
			);
		}
	}

	if ( taxonomy_exists( 'product_cat' ) ) {
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'number'     => 100,
		) );

		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			$categories = array_values( array_map(
				static function ( WP_Term $term ): array {
					return array(
						'id'     => $term->term_id,
						'name'   => $term->name,
						'slug'   => $term->slug,
						'parent' => $term->parent,
						'count'  => $term->count,
						'image'  => dewit_theme_get_product_category_image_data( $term->term_id ),
					);
				},
				$terms
			) );

			wp_add_inline_script(
				'dewit-theme-woocommerce-script',
				'window.dewitProductCategories = ' . wp_json_encode( $categories ) . ';',
				'before'
			);
		}
	}
}
add_action( 'wp_enqueue_scripts', 'dewit_theme_scripts' );

/**
 * Preload the first catalog product images so mobile LCP can start earlier.
 */
function dewit_theme_preload_shop_lcp_images(): void {
	if ( is_admin() || is_search() || ( function_exists( 'is_product' ) && is_product() ) ) {
		return;
	}

	$parent_slug = dewit_theme_get_current_parent_category_slug();

	if ( '' === $parent_slug ) {
		return;
	}

	$groups          = dewit_theme_get_grouped_category_products( $parent_slug );
	$preloaded_count = 0;

	foreach ( $groups as $group ) {
		foreach ( $group['products'] as $product ) {
			if ( empty( $product['image'] ) ) {
				continue;
			}

			printf(
				'<link rel="preload" as="image" href="%s" fetchpriority="high">' . "\n",
				esc_url( $product['image'] )
			);

			$preloaded_count++;

			if ( $preloaded_count >= 2 ) {
				return;
			}
		}
	}
}
add_action( 'wp_head', 'dewit_theme_preload_shop_lcp_images', 1 );

/**
 * Clean product text from ERP/WooCommerce before it is printed or sent to JavaScript.
 *
 * Some imported titles contain malformed numeric entities such as "&8221;"
 * instead of "&#8221;". Normalize those first, then decode valid entities.
 */
function dewit_theme_clean_product_text( string $text ): string {
	$text = wp_strip_all_tags( $text );
	$text = preg_replace( '/&(\d{2,6});/', '&#$1;', $text ) ?? $text;

	return html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) ?: 'UTF-8' );
}

/**
 * Return the configured default parent category for the shop landing page.
 */
function dewit_theme_get_default_parent_category_slug(): string {
	return '';
}

/**
 * Return the requested or default parent category slug.
 */
function dewit_theme_get_current_parent_category_slug(): string {
	if ( isset( $_GET['dewit_parent_cat'] ) ) {
		return sanitize_title( wp_unslash( $_GET['dewit_parent_cat'] ) );
	}

	return dewit_theme_get_default_parent_category_slug();
}

/**
 * Decide whether the shop landing page should open with a default category.
 */
function dewit_theme_should_use_default_parent_category(): bool {
	$is_product_page     = function_exists( 'is_product' ) && is_product();
	$is_product_taxonomy = function_exists( 'is_product_taxonomy' ) && is_product_taxonomy();
	$is_shop_page        = function_exists( 'is_shop' ) && is_shop();

	if ( is_admin() || is_search() || $is_product_page || $is_product_taxonomy ) {
		return false;
	}

	if ( ! ( $is_shop_page || is_post_type_archive( 'product' ) || is_front_page() || is_home() ) ) {
		return false;
	}

	foreach ( array_keys( $_GET ) as $key ) {
		if ( 'dewit_parent_cat' === $key || 'product_cat' === $key || str_starts_with( (string) $key, 'e-filter-' ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Determine whether the current shop view should render the category landing.
 */
function dewit_theme_is_shop_landing(): bool {
	$is_product_page     = function_exists( 'is_product' ) && is_product();
	$is_product_taxonomy = function_exists( 'is_product_taxonomy' ) && is_product_taxonomy();
	$is_shop_page        = function_exists( 'is_shop' ) && is_shop();

	if ( is_admin() || is_search() || $is_product_page || $is_product_taxonomy ) {
		return false;
	}

	if ( ! ( $is_shop_page || is_post_type_archive( 'product' ) || is_front_page() || is_home() ) ) {
		return false;
	}

	foreach ( array_keys( $_GET ) as $key ) {
		if ( 'dewit_parent_cat' === $key || 'product_cat' === $key || str_starts_with( (string) $key, 'e-filter-' ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Temporarily route the shop landing to a parent category while the landing page is being refined.
 */
function dewit_theme_redirect_temporary_shop_landing(): void {
	if ( ! dewit_theme_is_shop_landing() || '' === DEWIT_TEMPORARY_LANDING_PARENT_CATEGORY_SLUG ) {
		return;
	}

	wp_safe_redirect( dewit_theme_get_parent_category_shop_url( DEWIT_TEMPORARY_LANDING_PARENT_CATEGORY_SLUG ), 302 );
	exit;
}
add_action( 'template_redirect', 'dewit_theme_redirect_temporary_shop_landing', 5 );

/**
 * Build a shop URL for a selected parent category.
 */
function dewit_theme_get_parent_category_shop_url( string $slug ): string {
	return add_query_arg( 'dewit_parent_cat', sanitize_title( $slug ), home_url( '/' ) );
}

/**
 * Return product page back-link data with category context when possible.
 *
 * @return array{url:string,label:string}
 */
function dewit_theme_get_product_back_link( ?WC_Product $product = null ): array {
	$shop_url = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/?post_type=product' );
	$back_link = array(
		'url'   => $shop_url,
		'label' => __( 'Terug naar assortiment', 'dewit-theme-woocommerce' ),
	);
	$parent_slug = isset( $_GET['dewit_parent_cat'] ) ? sanitize_title( wp_unslash( $_GET['dewit_parent_cat'] ) ) : '';

	if ( '' === $parent_slug && $product instanceof WC_Product ) {
		$terms = get_the_terms( $product->get_id(), 'product_cat' );

		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			$term = reset( $terms );

			while ( $term instanceof WP_Term && $term->parent ) {
				$parent = get_term( $term->parent, 'product_cat' );

				if ( ! $parent instanceof WP_Term || is_wp_error( $parent ) ) {
					break;
				}

				$term = $parent;
			}

			if ( $term instanceof WP_Term ) {
				$parent_slug = $term->slug;
			}
		}
	}

	if ( '' !== $parent_slug ) {
		$parent_term = get_term_by( 'slug', $parent_slug, 'product_cat' );

		if ( $parent_term instanceof WP_Term ) {
			$back_link['url'] = dewit_theme_get_parent_category_shop_url( $parent_slug );
			$back_link['label'] = sprintf(
				/* translators: %s: product category name. */
				__( 'Terug naar %s', 'dewit-theme-woocommerce' ),
				dewit_theme_clean_product_text( $parent_term->name )
			);
		}
	}

	return $back_link;
}

/**
 * Return the first non-empty product meta value from a list of possible ERP keys.
 *
 * @param array<int, string> $keys Product meta keys.
 */
function dewit_theme_get_first_product_meta_value( int $product_id, array $keys ): string {
	foreach ( $keys as $key ) {
		$value = get_post_meta( $product_id, $key, true );

		if ( is_scalar( $value ) && '' !== trim( (string) $value ) ) {
			return trim( (string) $value );
		}
	}

	return '';
}

/**
 * Return optional ERP-driven product resource links.
 *
 * @return array<int, array{label:string,url:string,type:string}>
 */
function dewit_theme_get_product_resources( ?WC_Product $product = null ): array {
	if ( ! $product instanceof WC_Product ) {
		return array();
	}

	$product_id = $product->get_id();
	$resources = array(
		array(
			'label' => __( 'Video', 'dewit-theme-woocommerce' ),
			'type'  => 'video',
			'url'   => dewit_theme_get_first_product_meta_value( $product_id, array(
				'WB-videourl',
				'WB.videourl',
				'videourl',
				'_dewit_video_url',
			) ),
		),
		array(
			'label' => __( 'Handleiding', 'dewit-theme-woocommerce' ),
			'type'  => 'manual',
			'url'   => dewit_theme_get_first_product_meta_value( $product_id, array(
				'WB-handleidingurl',
				'WB.handleidingurl',
				'handleidingurl',
				'_dewit_manual_url',
			) ),
		),
		array(
			'label' => __( 'Tech specs', 'dewit-theme-woocommerce' ),
			'type'  => 'specs',
			'url'   => dewit_theme_get_first_product_meta_value( $product_id, array(
				'WB-techspecsurl',
				'WB.techspecsurl',
				'techspecsurl',
				'_dewit_tech_specs_url',
			) ),
		),
	);

	return array_values( array_filter(
		$resources,
		static function ( array $resource ): bool {
			return '' !== $resource['url'] && false !== filter_var( $resource['url'], FILTER_VALIDATE_URL );
		}
	) );
}

/**
 * Add WooCommerce body classes.
 *
 * @param array<string> $classes Existing classes.
 * @return array<string>
 */
function dewit_theme_body_classes( array $classes ): array {
	if ( class_exists( 'WooCommerce' ) ) {
		$classes[] = 'has-woocommerce';
	}

	if ( dewit_theme_is_shop_landing() ) {
		$classes[] = 'dewit-shop-landing';
	}

	return $classes;
}
add_filter( 'body_class', 'dewit_theme_body_classes' );

/**
 * Return visible top-level product category groups for the shop landing.
 *
 * @return array<int, array{label:string,parentSlug:string,productCount:int,image:string|false,imageWidth:int,imageHeight:int,children:array<int, array{name:string,slug:string,count:int}>}>
 */
function dewit_theme_get_landing_category_groups(): array {
	if ( ! taxonomy_exists( 'product_cat' ) ) {
		return array();
	}

	$terms = get_terms( array(
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'number'     => 100,
	) );

	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		return array();
	}

	$children_by_parent = array();

	foreach ( $terms as $term ) {
		if ( ! $term instanceof WP_Term ) {
			continue;
		}

		if ( 'alle' === $term->slug || 'alle' === strtolower( trim( $term->name ) ) ) {
			continue;
		}

		$children_by_parent[ $term->parent ][] = $term;
	}

	$parents = $children_by_parent[0] ?? array();
	usort(
		$parents,
		static function ( WP_Term $a, WP_Term $b ): int {
			return strnatcasecmp( $a->name, $b->name );
		}
	);

	$groups = array();

	foreach ( $parents as $parent ) {
		$children = $children_by_parent[ $parent->term_id ] ?? array();
		usort(
			$children,
			static function ( WP_Term $a, WP_Term $b ): int {
				return strnatcasecmp( $a->name, $b->name );
			}
		);

		$child_items    = array();
		$product_count  = absint( $parent->count );
		$visible_childs = array_filter(
			$children,
			static function ( WP_Term $child ): bool {
				return $child->count > 0;
			}
		);

		foreach ( $visible_childs as $child ) {
			$product_count += absint( $child->count );
			$child_items[] = array(
				'name'  => dewit_theme_clean_product_text( $child->name ),
				'slug'  => $child->slug,
				'count' => absint( $child->count ),
			);
		}

		if ( 0 === $product_count ) {
			continue;
		}

		$image_data = dewit_theme_get_product_category_image_data( $parent->term_id ) ?? dewit_theme_get_placeholder_image_data();

		$groups[] = array(
			'label'        => dewit_theme_clean_product_text( $parent->name ),
			'parentSlug'   => $parent->slug,
			'productCount' => $product_count,
			'image'        => $image_data['src'],
			'imageWidth'   => $image_data['width'],
			'imageHeight'  => $image_data['height'],
			'children'     => $child_items,
		);
	}

	return $groups;
}

/**
 * Render the category landing HTML used as a no-spinner fallback on the shop root.
 */
function dewit_theme_render_category_landing_html(): string {
	$groups = dewit_theme_get_landing_category_groups();

	if ( empty( $groups ) ) {
		return '';
	}

	ob_start();
	?>
	<div class="dewit-category-landing">
		<div class="dewit-category-landing__grid">
			<?php foreach ( $groups as $group ) : ?>
				<?php
				$children      = array_slice( $group['children'], 0, 3 );
				$child_names   = wp_list_pluck( $children, 'name' );
				?>
				<a class="dewit-category-landing-card" href="<?php echo esc_url( dewit_theme_get_parent_category_shop_url( $group['parentSlug'] ) ); ?>">
					<span class="dewit-category-landing-card__header">
						<img
							src="<?php echo esc_url( $group['image'] ); ?>"
							alt=""
							width="<?php echo esc_attr( $group['imageWidth'] ); ?>"
							height="<?php echo esc_attr( $group['imageHeight'] ); ?>"
							loading="lazy"
							decoding="async"
						>
					</span>
					<span class="dewit-category-landing-card__content">
						<span class="dewit-category-landing-card__title"><?php echo esc_html( $group['label'] ); ?></span>
						<span class="dewit-category-landing-card__description"><?php echo esc_html( $child_names ? implode( ', ', $child_names ) : __( 'Bekijk alle producten in deze hoofdgroep', 'dewit-theme-woocommerce' ) ); ?></span>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
	<?php
	return trim( ob_get_clean() );
}

/**
 * Print a server-rendered category landing fallback into Elementor's loop container.
 */
function dewit_theme_print_category_landing_fallback(): void {
	if ( ! dewit_theme_is_shop_landing() ) {
		return;
	}

	$html = dewit_theme_render_category_landing_html();

	if ( '' === $html ) {
		return;
	}
	?>
	<script>
	(function () {
		const landingHtml = <?php echo wp_json_encode( $html ); ?>;

		function renderLanding() {
			const widget = document.querySelector('.elementor-widget-loop-grid');
			const container = widget ? widget.querySelector('.elementor-loop-container') : null;

			document.body.classList.add('dewit-shop-landing');

			if (!container || container.querySelector('.dewit-category-landing')) {
				return;
			}

			container.innerHTML = landingHtml;
			container.classList.add('dewit-landing-mode');
			container.classList.remove('elementor-grid', 'dewit-grouped-mode');
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', renderLanding);
		} else {
			renderLanding();
		}

		window.addEventListener('load', renderLanding);
	}());
	</script>
	<?php
}
add_action( 'wp_footer', 'dewit_theme_print_category_landing_fallback', 90 );

/**
 * Print a small independent sidebar renderer so Elementor's default "Alle" item
 * can never be the only visible category navigation.
 */
function dewit_theme_print_sidebar_category_fallback(): void {
	if ( ! taxonomy_exists( 'product_cat' ) ) {
		return;
	}

	$terms = get_terms( array(
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'number'     => 100,
	) );

	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		return;
	}

	$categories = array_values( array_map(
		static function ( WP_Term $term ): array {
			return array(
				'id'     => $term->term_id,
				'name'   => $term->name,
				'slug'   => $term->slug,
				'parent' => $term->parent,
				'count'  => $term->count,
				'image'  => dewit_theme_get_product_category_image_data( $term->term_id ),
			);
		},
		$terms
	) );
	?>
	<script>
	(function () {
		const categories = <?php echo wp_json_encode( $categories ); ?>;
		window.dewitProductCategories = Array.isArray(window.dewitProductCategories) && window.dewitProductCategories.length
			? window.dewitProductCategories
			: categories;

		function isVisibleCategory(category) {
			return category && category.slug !== 'alle' && String(category.name || '').trim().toLowerCase() !== 'alle';
		}

		function hasProducts(category, childrenByParent) {
			const children = childrenByParent.get(category.id) || [];
			return Number(category.count) > 0 || children.some(function (child) {
				return hasProducts(child, childrenByParent);
			});
		}

		function getUrl(slug) {
			const url = new URL(window.location.href);

			Array.from(url.searchParams.keys()).forEach(function (key) {
				if (key.indexOf('e-filter-') === 0 || key === 'product_cat' || key === 'dewit_parent_cat') {
					url.searchParams.delete(key);
				}
			});

			url.searchParams.delete('product-page');
			url.searchParams.set('dewit_parent_cat', slug);
			return url.toString();
		}

		function getCategorySectionId(slug) {
			return 'dewit-cat-' + String(slug || '').replace(/[^a-z0-9_-]/gi, '-');
		}

		function scrollToCategorySection(slug) {
			const section = document.getElementById(getCategorySectionId(slug));

			if (!section) {
				return;
			}

			section.scrollIntoView({
				block: 'start',
				behavior: 'smooth',
			});
		}

		const categoryIconKeywords = [
			{ icon: 'plug', terms: ['elektra', 'elektrisch', 'kabel', 'stroom', 'verdeel', 'haspel'] },
			{ icon: 'shield', terms: ['pbm', 'veiligheid', 'helm', 'bescherming', 'bril', 'handschoen'] },
			{ icon: 'layers', terms: ['steiger', 'vloeren', 'planken', 'doeken'] },
			{ icon: 'panel', terms: ['hek', 'hekken', 'bouwhek', 'pallet', 'opslag', 'stapel'] },
			{ icon: 'seal', terms: ['voeg', 'afdichting', 'kimband', 'tape', 'band'] },
			{ icon: 'support', terms: ['ondersteuning', 'ondersteuningsmateriaal', 'afstandhouder', 'stel', 'ribben'] },
			{ icon: 'pipe', terms: ['buis', 'buizen', 'konus', 'konussen', 'pe'] },
			{ icon: 'tool', terms: ['bouwmachine', 'machines', 'gereedschap', 'mixer', 'betonmolen'] },
		];

		const categoryIconSvgs = {
			plug: '<path d="M9 7V2"/><path d="M15 7V2"/><path d="M6 7h12v5a6 6 0 0 1-12 0Z"/><path d="M12 18v4"/>',
			shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
			layers: '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
			panel: '<path d="M4 4v16"/><path d="M20 4v16"/><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
			seal: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/><path d="m8 4-4 16"/><path d="m16 4 4 16"/>',
			support: '<path d="M6 20V8"/><path d="M18 20V8"/><path d="M4 8h16"/><path d="M8 4h8"/><path d="M9 20h6"/><path d="m6 14 12-6"/><path d="m18 14-12-6"/>',
			pipe: '<path d="M4 8c0-2.2 3.6-4 8-4s8 1.8 8 4-3.6 4-8 4-8-1.8-8-4Z"/><path d="M4 8v8c0 2.2 3.6 4 8 4s8-1.8 8-4V8"/><path d="M8 10v8"/><path d="M16 10v8"/>',
			tool: '<path d="m14.7 6.3 3-3a2.8 2.8 0 0 1 3.2 3.2l-3 3"/><path d="m13 8 3 3"/><path d="M3 21l9.5-9.5"/><path d="m7 17 3 3"/>',
			box: '<path d="m7.5 4.3 9 5.2"/><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
		};

		function getCategoryIconName(category) {
			const value = [category.slug, category.name].filter(Boolean).join(' ').toLowerCase();
			const match = categoryIconKeywords.find(function (entry) {
				return entry.terms.some(function (term) {
					return value.indexOf(term) > -1;
				});
			});

			return match ? match.icon : 'box';
		}

		function appendCategoryTriggerContent(trigger, category) {
			const icon = document.createElement('span');
			const label = document.createElement('span');
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

			icon.className = 'dewit-category-icon';
			icon.setAttribute('aria-hidden', 'true');
			svg.setAttribute('viewBox', '0 0 24 24');
			svg.setAttribute('fill', 'none');
			svg.setAttribute('stroke', 'currentColor');
			svg.setAttribute('stroke-width', '2');
			svg.setAttribute('stroke-linecap', 'round');
			svg.setAttribute('stroke-linejoin', 'round');
			svg.innerHTML = categoryIconSvgs[getCategoryIconName(category)] || categoryIconSvgs.box;
			icon.appendChild(svg);

			label.className = 'dewit-category-label';
			label.textContent = category.name || '';

			trigger.appendChild(icon);
			trigger.appendChild(label);
		}

		function render() {
			const filter = document.querySelector('#catalog-sidebar .elementor-widget-taxonomy-filter .e-filter');

			if (!filter || !Array.isArray(categories) || !categories.length) {
				return;
			}

			const childrenByParent = new Map();

			categories.filter(isVisibleCategory).forEach(function (category) {
				if (!childrenByParent.has(category.parent)) {
					childrenByParent.set(category.parent, []);
				}

				childrenByParent.get(category.parent).push(category);
			});

			const parents = (childrenByParent.get(0) || [])
				.filter(function (category) {
					return hasProducts(category, childrenByParent);
				})
				.sort(function (a, b) {
					return a.name.localeCompare(b.name, 'nl');
				});

			if (!parents.length) {
				return;
			}

			const activeParent = new URL(window.location.href).searchParams.get('dewit_parent_cat') || '';
			filter.innerHTML = '';

			parents.forEach(function (category) {
				const group = document.createElement('div');
				const link = document.createElement('a');
				const children = (childrenByParent.get(category.id) || [])
					.filter(function (child) {
						return hasProducts(child, childrenByParent);
					})
					.sort(function (a, b) {
						return a.name.localeCompare(b.name, 'nl');
					});

				group.className = 'dewit-category-group';
				group.classList.toggle('is-open', activeParent === category.slug);
				link.className = 'dewit-category-trigger';
				link.href = getUrl(category.slug);
				link.setAttribute('aria-pressed', activeParent === category.slug ? 'true' : 'false');
				appendCategoryTriggerContent(link, category);
				group.appendChild(link);

				if (children.length) {
					const panel = document.createElement('div');
					panel.className = 'dewit-category-panel';
					panel.hidden = activeParent !== category.slug;

					children.forEach(function (child) {
						const childLink = document.createElement('a');
						childLink.className = 'dewit-category-child';
						childLink.href = getUrl(category.slug) + '#' + getCategorySectionId(child.slug);
						childLink.setAttribute('data-filter', child.slug);
						childLink.textContent = child.name || '';
						childLink.addEventListener('click', function (event) {
							event.preventDefault();
							event.stopPropagation();

							if (activeParent !== category.slug) {
								window.location.href = childLink.href;
								return;
							}

							document.querySelectorAll('.dewit-category-child[aria-pressed="true"]').forEach(function (item) {
								item.setAttribute('aria-pressed', 'false');
							});
							childLink.setAttribute('aria-pressed', 'true');
							scrollToCategorySection(child.slug);
						});
						panel.appendChild(childLink);
					});

					group.appendChild(panel);
				}

				filter.appendChild(group);
			});

			filter.classList.add('dewit-category-dropdowns-ready');
			window.dispatchEvent(new CustomEvent('dewit/categories-ready'));
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', render);
		} else {
			render();
		}

		window.addEventListener('load', render);
	}());
	</script>
	<?php
}
add_action( 'wp_footer', 'dewit_theme_print_sidebar_category_fallback', 99 );

/**
 * Customize WooCommerce wrappers to match the theme layout.
 */
function dewit_theme_woocommerce_wrapper_start(): void {
	echo '<main id="primary" class="site-main site-main--shop"><div class="container shop-layout">';

	if ( is_active_sidebar( 'shop-sidebar' ) && ( is_shop() || is_product_taxonomy() ) ) {
		echo '<aside class="shop-sidebar">';
		dynamic_sidebar( 'shop-sidebar' );
		echo '</aside><div class="shop-content">';
	}
}

function dewit_theme_woocommerce_wrapper_end(): void {
	if ( is_active_sidebar( 'shop-sidebar' ) && ( is_shop() || is_product_taxonomy() ) ) {
		echo '</div>';
	}

	echo '</div></main>';
}

remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
add_action( 'woocommerce_before_main_content', 'dewit_theme_woocommerce_wrapper_start', 10 );
add_action( 'woocommerce_after_main_content', 'dewit_theme_woocommerce_wrapper_end', 10 );

/**
 * Adjust WooCommerce product grid defaults.
 */
function dewit_theme_loop_columns(): int {
	return 3;
}
add_filter( 'loop_shop_columns', 'dewit_theme_loop_columns' );

function dewit_theme_products_per_page(): int {
	return 12;
}
add_filter( 'loop_shop_per_page', 'dewit_theme_products_per_page' );

/**
 * Product searches should always be global, even if a stale frontend still submits category filters.
 */
function dewit_theme_strip_category_filters_from_product_search(): void {
	if ( is_admin() || ! is_search() || 'product' !== get_query_var( 'post_type' ) ) {
		return;
	}

	$has_filter = false;
	$url        = home_url( '/' );
	$params     = array();

	foreach ( $_GET as $key => $value ) {
		$clean_key = sanitize_key( wp_unslash( $key ) );

		if ( 'product_cat' === $clean_key || str_starts_with( $clean_key, 'e-filter-' ) ) {
			$has_filter = true;
			continue;
		}

		if ( ! is_scalar( $value ) ) {
			continue;
		}

		$params[ $clean_key ] = sanitize_text_field( wp_unslash( $value ) );
	}

	if ( ! $has_filter ) {
		return;
	}

	wp_safe_redirect( add_query_arg( $params, $url ) );
	exit;
}
add_action( 'template_redirect', 'dewit_theme_strip_category_filters_from_product_search' );

/**
 * Match product searches against title, content, SKU, product categories, and product tags.
 *
 * @param string   $search Existing SQL search fragment.
 * @param WP_Query $query  Current query.
 * @return string
 */
function dewit_theme_expand_product_search_sql( string $search, WP_Query $query ): string {
	if ( is_admin() || ! $query->is_search() ) {
		return $search;
	}

	$post_type = $query->get( 'post_type' );

	if ( 'product' !== $post_type && ! ( is_array( $post_type ) && in_array( 'product', $post_type, true ) ) ) {
		return $search;
	}

	$term = trim( (string) $query->get( 's' ) );

	if ( '' === $term ) {
		return $search;
	}

	global $wpdb;

	$like        = '%' . $wpdb->esc_like( $term ) . '%';
	$product_ids = dewit_theme_get_product_ids_for_term_matches( $term, 80 );
	$id_sql      = '';

	if ( ! empty( $product_ids ) ) {
		$id_sql = ' OR ' . $wpdb->posts . '.ID IN (' . implode( ',', array_map( 'absint', $product_ids ) ) . ')';
	}

	return $wpdb->prepare(
		" AND (
			({$wpdb->posts}.post_title LIKE %s)
			OR ({$wpdb->posts}.post_excerpt LIKE %s)
			OR ({$wpdb->posts}.post_content LIKE %s)
			OR EXISTS (
				SELECT 1
				FROM {$wpdb->postmeta} dewit_sku_search
				WHERE dewit_sku_search.post_id = {$wpdb->posts}.ID
				AND dewit_sku_search.meta_key = '_sku'
				AND dewit_sku_search.meta_value LIKE %s
			)
			{$id_sql}
		)",
		$like,
		$like,
		$like,
		$like
	);
}
add_filter( 'posts_search', 'dewit_theme_expand_product_search_sql', 10, 2 );

/**
 * Get product IDs connected to matching product categories or tags.
 *
 * @param string $term Search term.
 * @param int    $limit Max product IDs.
 * @return array<int>
 */
function dewit_theme_get_product_ids_for_term_matches( string $term, int $limit = 20 ): array {
	$taxonomies = array_filter( array( 'product_cat', 'product_tag' ), 'taxonomy_exists' );

	if ( empty( $taxonomies ) ) {
		return array();
	}

	$terms = get_terms( array(
		'taxonomy'   => $taxonomies,
		'hide_empty' => true,
		'number'     => 20,
		'search'     => $term,
	) );

	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		return array();
	}

	$terms_by_taxonomy = array();

	foreach ( $terms as $matched_term ) {
		if ( $matched_term instanceof WP_Term ) {
			$terms_by_taxonomy[ $matched_term->taxonomy ][] = absint( $matched_term->term_id );
		}
	}

	if ( empty( $terms_by_taxonomy ) ) {
		return array();
	}

	$tax_query = array( 'relation' => 'OR' );

	foreach ( $terms_by_taxonomy as $taxonomy => $term_ids ) {
		$tax_query[] = array(
			'taxonomy' => $taxonomy,
			'field'    => 'term_id',
			'terms'    => array_values( array_unique( $term_ids ) ),
			'operator' => 'IN',
		);
	}

	$products = get_posts( array(
		'post_type'              => 'product',
		'post_status'            => 'publish',
		'fields'                 => 'ids',
		'posts_per_page'         => $limit,
		'no_found_rows'          => true,
		'update_post_meta_cache' => false,
		'update_post_term_cache' => false,
		'tax_query'              => $tax_query,
	) );

	return array_map( 'absint', $products );
}

/**
 * Return live product search suggestions for the custom toolbar.
 */
function dewit_theme_ajax_product_search(): void {
	$term = isset( $_GET['term'] ) ? sanitize_text_field( wp_unslash( $_GET['term'] ) ) : '';

	if ( strlen( $term ) < 2 ) {
		wp_send_json_success( array() );
	}

	$product_ids = array();

	$title_query = new WP_Query( array(
		'post_type'              => 'product',
		'post_status'            => 'publish',
		's'                      => $term,
		'fields'                 => 'ids',
		'posts_per_page'         => 8,
		'no_found_rows'          => true,
		'update_post_meta_cache' => false,
		'update_post_term_cache' => false,
	) );

	$product_ids = array_merge( $product_ids, array_map( 'absint', $title_query->posts ) );

	$sku_products = get_posts( array(
		'post_type'              => 'product',
		'post_status'            => 'publish',
		'fields'                 => 'ids',
		'posts_per_page'         => 8,
		'no_found_rows'          => true,
		'update_post_term_cache' => false,
		'meta_query'             => array(
			array(
				'key'     => '_sku',
				'value'   => $term,
				'compare' => 'LIKE',
			),
		),
	) );

	$product_ids = array_merge( $product_ids, array_map( 'absint', $sku_products ) );
	$product_ids = array_merge( $product_ids, dewit_theme_get_product_ids_for_term_matches( $term, 8 ) );
	$product_ids = array_values( array_unique( array_filter( $product_ids ) ) );

	if ( empty( $product_ids ) ) {
		wp_send_json_success( array() );
	}

	$args = array(
		'post_type'              => 'product',
		'post_status'            => 'publish',
		'post__in'               => $product_ids,
		'orderby'                => 'post__in',
		'posts_per_page'         => 6,
		'no_found_rows'          => true,
		'update_post_term_cache' => true,
	);

	$results = array();
	$products = new WP_Query( $args );

	foreach ( $products->posts as $post_id ) {
		$product = wc_get_product( $post_id );

		if ( ! $product instanceof WC_Product ) {
			continue;
		}

		$results[] = array(
			'title'      => dewit_theme_clean_product_text( get_the_title( $post_id ) ),
			'url'        => get_permalink( $post_id ),
			'sku'        => dewit_theme_clean_product_text( $product->get_sku() ),
			'image'      => get_the_post_thumbnail_url( $post_id, 'woocommerce_thumbnail' ),
			'categories' => dewit_theme_clean_product_text( wp_strip_all_tags( wc_get_product_category_list( $post_id, ', ' ) ) ),
		);
	}

	wp_send_json_success( $results );
}
add_action( 'wp_ajax_dewit_product_search', 'dewit_theme_ajax_product_search' );
add_action( 'wp_ajax_nopriv_dewit_product_search', 'dewit_theme_ajax_product_search' );

/**
 * Get products grouped by direct child categories for a selected parent category.
 *
 * @param string $slug Parent category slug.
 * @return array<int, array{name:string, slug:string, products:array<int, array{id:int, title:string, url:string, sku:string, image:string|false, image_width:int, image_height:int}>}>
 */
function dewit_theme_get_grouped_category_products( string $slug ): array {
	static $grouped_products_cache = array();

	if ( '' === $slug || ! taxonomy_exists( 'product_cat' ) ) {
		return array();
	}

	if ( isset( $grouped_products_cache[ $slug ] ) ) {
		return $grouped_products_cache[ $slug ];
	}

	$parent = get_term_by( 'slug', $slug, 'product_cat' );

	if ( ! $parent instanceof WP_Term ) {
		return array();
	}

	$children = get_terms( array(
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'parent'     => $parent->term_id,
		'orderby'    => 'name',
		'order'      => 'ASC',
	) );

	if ( is_wp_error( $children ) || empty( $children ) ) {
		$children = array( $parent );
	}

	$groups = array();

	foreach ( $children as $child ) {
		if ( ! $child instanceof WP_Term ) {
			continue;
		}

		$products = new WP_Query( array(
			'post_type'              => 'product',
			'post_status'            => 'publish',
			'fields'                 => 'ids',
			'posts_per_page'         => -1,
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'tax_query'              => array(
				array(
					'taxonomy' => 'product_cat',
					'field'    => 'term_id',
					'terms'    => $child->term_id,
				),
			),
			'orderby'                => array(
				'menu_order' => 'ASC',
				'title'      => 'ASC',
			),
		) );

		if ( ! $products->have_posts() ) {
			continue;
		}

		$items = array();

		foreach ( $products->posts as $post_id ) {
			$product = wc_get_product( $post_id );

			if ( ! $product instanceof WC_Product ) {
				continue;
			}

			$image_id   = get_post_thumbnail_id( $post_id );
			$image_data = $image_id ? wp_get_attachment_image_src( $image_id, 'woocommerce_thumbnail' ) : false;

			$items[] = array(
				'id'           => absint( $post_id ),
				'title'        => dewit_theme_clean_product_text( get_the_title( $post_id ) ),
				'url'          => add_query_arg( 'dewit_parent_cat', $parent->slug, get_permalink( $post_id ) ),
				'sku'          => dewit_theme_clean_product_text( $product->get_sku() ),
				'image'        => $image_data ? $image_data[0] : false,
				'image_width'  => $image_data ? absint( $image_data[1] ) : 300,
				'image_height' => $image_data ? absint( $image_data[2] ) : 300,
			);
		}

		if ( empty( $items ) ) {
			continue;
		}

		$groups[] = array(
			'name'     => dewit_theme_clean_product_text( $child->name ),
			'slug'     => $child->slug,
			'products' => $items,
		);
	}

	$grouped_products_cache[ $slug ] = $groups;

	return $groups;
}

/**
 * Render grouped category products markup.
 *
 * @param string $slug Parent category slug.
 * @return string
 */
function dewit_theme_render_grouped_category_products_html( string $slug ): string {
	$groups = dewit_theme_get_grouped_category_products( $slug );

	ob_start();
	?>
	<div class="dewit-grouped-products is-visible" style="display: grid;">
		<?php if ( empty( $groups ) ) : ?>
			<div class="dewit-grouped-products__status"><?php esc_html_e( 'Geen producten gevonden', 'dewit-theme-woocommerce' ); ?></div>
		<?php else : ?>
			<?php $product_index = 0; ?>
			<?php foreach ( $groups as $group ) : ?>
				<section class="dewit-grouped-products__section" id="<?php echo esc_attr( 'dewit-cat-' . sanitize_html_class( $group['slug'] ) ); ?>" data-category-slug="<?php echo esc_attr( $group['slug'] ); ?>">
					<h2 class="dewit-grouped-products__heading"><?php echo esc_html( $group['name'] ); ?></h2>
					<div class="dewit-grouped-products__grid<?php echo 1 === count( $group['products'] ) ? ' is-single' : ''; ?>">
						<?php foreach ( $group['products'] as $product ) : ?>
							<?php
							$is_priority_image = $product_index < 4;
							$is_lcp_candidate  = $product_index < 2;
							$product_index++;
							?>
							<a class="dewit-grouped-product-card" href="<?php echo esc_url( $product['url'] ); ?>">
								<span class="dewit-grouped-product-card__image">
									<?php if ( $product['image'] ) : ?>
										<img
											src="<?php echo esc_url( $product['image'] ); ?>"
											alt=""
											width="<?php echo esc_attr( $product['image_width'] ); ?>"
											height="<?php echo esc_attr( $product['image_height'] ); ?>"
											loading="<?php echo esc_attr( $is_priority_image ? 'eager' : 'lazy' ); ?>"
											decoding="async"
											fetchpriority="<?php echo esc_attr( $is_lcp_candidate ? 'high' : 'low' ); ?>"
										>
									<?php endif; ?>
								</span>
								<span class="dewit-grouped-product-card__body">
									<span class="dewit-grouped-product-card__sku"><?php echo esc_html( $product['sku'] ); ?></span>
									<span class="dewit-grouped-product-card__title"><?php echo esc_html( $product['title'] ); ?></span>
								</span>
							</a>
						<?php endforeach; ?>
					</div>
				</section>
			<?php endforeach; ?>
		<?php endif; ?>
	</div>
	<?php
	return trim( ob_get_clean() );
}

/**
 * Return products grouped by direct child categories for a selected parent category.
 */
function dewit_theme_ajax_grouped_category_products(): void {
	$slug = isset( $_GET['category'] ) ? sanitize_title( wp_unslash( $_GET['category'] ) ) : '';
	wp_send_json_success( dewit_theme_get_grouped_category_products( $slug ) );
}
add_action( 'wp_ajax_dewit_category_grouped_products', 'dewit_theme_ajax_grouped_category_products' );
add_action( 'wp_ajax_nopriv_dewit_category_grouped_products', 'dewit_theme_ajax_grouped_category_products' );

/**
 * Temporarily disable purchasing while the catalog is being prepared.
 */
function dewit_theme_disable_product_purchases(): bool {
	return false;
}
add_filter( 'woocommerce_is_purchasable', 'dewit_theme_disable_product_purchases' );

/**
 * Use Dutch copy for the related products section.
 */
function dewit_theme_related_products_heading(): string {
	return __( 'Meer uit deze categorie', 'dewit-theme-woocommerce' );
}
add_filter( 'woocommerce_product_related_products_heading', 'dewit_theme_related_products_heading' );
