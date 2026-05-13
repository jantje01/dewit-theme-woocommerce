<?php
/**
 * Archive template.
 *
 * @package DewitTheme
 */

get_header();
?>

<main id="primary" class="site-main">
	<div class="container content-layout">
		<section class="content-area">
			<?php if ( have_posts() ) : ?>
				<header class="page-header">
					<?php
					the_archive_title( '<h1 class="page-title">', '</h1>' );
					the_archive_description( '<div class="archive-description">', '</div>' );
					?>
				</header>

				<?php
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/content', get_post_type() );
				endwhile;

				the_posts_pagination();
				?>
			<?php else : ?>
				<?php get_template_part( 'template-parts/content', 'none' ); ?>
			<?php endif; ?>
		</section>

		<?php get_sidebar(); ?>
	</div>
</main>

<?php
get_footer();
