<?php
/**
 * The footer for the theme.
 *
 * @package DewitTheme
 */

?>
<footer class="site-footer">
	<div class="container site-footer__inner">
		<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?></p>
		<nav class="footer-navigation" aria-label="<?php esc_attr_e( 'Footer menu', 'dewit-theme-woocommerce' ); ?>">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'footer',
				'container'      => false,
				'fallback_cb'    => false,
			) );
			?>
		</nav>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
