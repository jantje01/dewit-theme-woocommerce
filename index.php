<?php
/**
 * Main template file.
 *
 * @package DewitTheme
 */

get_header();
?>

<main id="primary" class="site-main">
	<div class="container content-layout">
		<section class="content-area">
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
