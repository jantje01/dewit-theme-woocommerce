<?php
/**
 * Search results template.
 *
 * @package DewitTheme
 */

get_header();
?>

<main id="primary" class="site-main">
	<div class="container content-layout">
		<section class="content-area">
			<header class="page-header">
				<h1 class="page-title">
					<?php
					printf(
						esc_html__( 'Search results for: %s', 'dewit-theme' ),
						'<span>' . esc_html( get_search_query() ) . '</span>'
					);
					?>
				</h1>
			</header>

			<?php
			if ( have_posts() ) :
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/content', get_post_type() );
				endwhile;

				the_posts_pagination();
			else :
				get_template_part( 'template-parts/content', 'none' );
			endif;
			?>
		</section>

		<?php get_sidebar(); ?>
	</div>
</main>

<?php
get_footer();
