<?php
/**
 * Empty content template.
 *
 * @package DewitTheme
 */

?>
<section class="no-results not-found">
	<header class="page-header">
		<h1 class="page-title"><?php esc_html_e( 'Nothing found', 'dewit-theme' ); ?></h1>
	</header>

	<div class="page-content">
		<p><?php esc_html_e( 'Try searching for what you need.', 'dewit-theme' ); ?></p>
		<?php get_search_form(); ?>
	</div>
</section>
