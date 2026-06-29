<?php
/**
 * Horizontal shop category navigation.
 *
 * @package DewitTheme
 *
 * @var array{items?:array<int,array{label:string,slug:string,url:string,isActive:bool,children:array<int,array{label:string,slug:string,url:string,isActive:bool}>}>,logoUrl?:string,homeUrl?:string} $args
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$items    = $args['items'] ?? array();
$logo_url = $args['logoUrl'] ?? '';
$home_url = $args['homeUrl'] ?? home_url( '/' );

if ( empty( $items ) ) {
	return;
}
?>
<nav class="dewit-horizontal-category-nav" aria-label="<?php esc_attr_e( 'Productcategorieën', 'dewit-theme-woocommerce' ); ?>">
	<div class="dewit-horizontal-category-nav__inner">
		<a class="dewit-horizontal-category-nav__logo" href="<?php echo esc_url( $home_url ); ?>" aria-label="<?php esc_attr_e( 'De Wit Bouwmachines home', 'dewit-theme-woocommerce' ); ?>">
			<?php if ( '' !== $logo_url ) : ?>
				<img src="<?php echo esc_url( $logo_url ); ?>" alt="De Wit Bouwmachines" decoding="async">
			<?php else : ?>
				<span>De Wit</span>
			<?php endif; ?>
		</a>

		<div class="dewit-horizontal-category-nav__track" role="list">
			<?php foreach ( $items as $item ) : ?>
				<div class="dewit-horizontal-category-nav__item<?php echo $item['isActive'] ? ' is-active' : ''; ?>" role="listitem">
					<a class="dewit-horizontal-category-nav__link" href="<?php echo esc_url( $item['url'] ); ?>"<?php echo $item['isActive'] ? ' aria-current="page"' : ''; ?>>
						<span><?php echo esc_html( $item['label'] ); ?></span>
					</a>

					<?php if ( ! empty( $item['children'] ) ) : ?>
						<div class="dewit-horizontal-category-nav__submenu">
							<?php foreach ( $item['children'] as $child ) : ?>
								<a class="dewit-horizontal-category-nav__child<?php echo $child['isActive'] ? ' is-active' : ''; ?>" href="<?php echo esc_url( $child['url'] ); ?>">
									<?php echo esc_html( $child['label'] ); ?>
								</a>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</nav>
