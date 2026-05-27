<?php
/**
 * De Wit Theme WooCommerce functions and definitions.
 *
 * @package DewitTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DEWIT_THEME_VERSION', '0.2.47' );

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
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
		)
	);

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
 * Add WooCommerce body classes.
 *
 * @param array<string> $classes Existing classes.
 * @return array<string>
 */
function dewit_theme_body_classes( array $classes ): array {
	if ( class_exists( 'WooCommerce' ) ) {
		$classes[] = 'has-woocommerce';
	}

	return $classes;
}
add_filter( 'body_class', 'dewit_theme_body_classes' );

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
			'title'      => get_the_title( $post_id ),
			'url'        => get_permalink( $post_id ),
			'sku'        => $product->get_sku(),
			'image'      => get_the_post_thumbnail_url( $post_id, 'woocommerce_thumbnail' ),
			'categories' => wp_strip_all_tags( wc_get_product_category_list( $post_id, ', ' ) ),
		);
	}

	wp_send_json_success( $results );
}
add_action( 'wp_ajax_dewit_product_search', 'dewit_theme_ajax_product_search' );
add_action( 'wp_ajax_nopriv_dewit_product_search', 'dewit_theme_ajax_product_search' );

/**
 * Return products grouped by direct child categories for a selected parent category.
 */
function dewit_theme_ajax_grouped_category_products(): void {
	$slug = isset( $_GET['category'] ) ? sanitize_title( wp_unslash( $_GET['category'] ) ) : '';

	if ( '' === $slug || ! taxonomy_exists( 'product_cat' ) ) {
		wp_send_json_success( array() );
	}

	$parent = get_term_by( 'slug', $slug, 'product_cat' );

	if ( ! $parent instanceof WP_Term ) {
		wp_send_json_success( array() );
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

			$items[] = array(
				'id'    => $post_id,
				'title' => get_the_title( $post_id ),
				'url'   => get_permalink( $post_id ),
				'sku'   => $product->get_sku(),
				'image' => get_the_post_thumbnail_url( $post_id, 'woocommerce_thumbnail' ),
			);
		}

		if ( empty( $items ) ) {
			continue;
		}

		$groups[] = array(
			'name'     => $child->name,
			'slug'     => $child->slug,
			'products' => $items,
		);
	}

	wp_send_json_success( $groups );
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
