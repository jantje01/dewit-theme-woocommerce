<?php
/**
 * De Wit Theme WooCommerce functions and definitions.
 *
 * @package DewitTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DEWIT_THEME_VERSION', '0.1.2' );

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
