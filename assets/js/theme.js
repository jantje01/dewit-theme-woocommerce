(function () {
	const toggle = document.querySelector('.menu-toggle');
	const nav = document.querySelector('.main-navigation');

	if (toggle && document.getElementById('catalog-sidebar')) {
		return;
	}

	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			const isOpen = nav.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', String(isOpen));
		});
	}
}());

(function () {
	let searchRequestController = null;
	let searchDebounceTimer = null;
	const productCardViewStorageKey = 'dewitProductCardViewV3';

	function getThemeConfig() {
		return window.dewitTheme || (typeof dewitTheme !== 'undefined' ? dewitTheme : {});
	}

	function normalizeDisplayText(value) {
		const normalized = String(value || '').replace(/&(\d{2,6});/g, '&#$1;');
		const parser = document.createElement('textarea');
		parser.innerHTML = normalized;

		return parser.value;
	}

	function getProductCardViewMode() {
		const defaultMode = window.matchMedia && window.matchMedia('(min-width: 767px)').matches ? 'horizontal' : 'grid';

		try {
			const storedMode = window.localStorage.getItem(productCardViewStorageKey);

			if (storedMode === 'horizontal' || storedMode === 'grid' || storedMode === 'table') {
				return storedMode;
			}

			return defaultMode;
		} catch (error) {
			return defaultMode;
		}
	}

	function replayGroupedProductCardAnimation() {
		const cards = document.querySelectorAll('.dewit-grouped-product-card');

		cards.forEach(function (card, index) {
			card.style.animation = 'none';
			card.style.setProperty('--dewit-card-index', String(Math.min(index, 24)));
		});

		if (cards.length) {
			cards[0].offsetHeight;
		}

		cards.forEach(function (card) {
			card.style.animation = '';
		});
	}

	function setProductCardViewMode(mode, replayCards) {
		const nextMode = mode === 'horizontal' || mode === 'table' ? mode : 'grid';
		const currentMode = document.body.classList.contains('dewit-table-product-cards')
			? 'table'
			: (document.body.classList.contains('dewit-horizontal-product-cards') ? 'horizontal' : 'grid');

		document.body.classList.toggle('dewit-horizontal-product-cards', nextMode === 'horizontal');
		document.body.classList.toggle('dewit-table-product-cards', nextMode === 'table');
		document.querySelectorAll('.dewit-product-view-switch__button').forEach(function (button) {
			const isActive = button.getAttribute('data-view') === nextMode;
			button.classList.toggle('is-active', isActive);
			button.setAttribute('aria-pressed', String(isActive));
		});

		try {
			window.localStorage.setItem(productCardViewStorageKey, nextMode);
		} catch (error) {
			// localStorage can be disabled in some browser privacy modes.
		}

		if (replayCards && currentMode !== nextMode) {
			window.requestAnimationFrame(replayGroupedProductCardAnimation);
		}
	}

	function getActiveParentCategorySlugForLabel() {
		const url = new URL(window.location.href);
		const config = getThemeConfig();

		return url.searchParams.get('dewit_parent_cat') || config.defaultParentCategory || '';
	}

	function getActiveParentCategoryLabel() {
		const activeSlug = getActiveParentCategorySlugForLabel();
		const categories = window.dewitProductCategories || [];
		const match = categories.find(function (category) {
			return category && category.slug === activeSlug;
		});
		const activeTrigger = document.querySelector('.dewit-category-trigger[aria-pressed="true"] .dewit-category-label');

		if (match && match.name) {
			return normalizeDisplayText(match.name);
		}

		if (activeTrigger && activeTrigger.textContent.trim()) {
			return normalizeDisplayText(activeTrigger.textContent.trim());
		}

		return 'Alle producten';
	}

	function routeSidebarLogoToHome() {
		const config = getThemeConfig();
		const homeUrl = config.homeUrl || window.location.origin + '/';
		const sidebar = document.getElementById('catalog-sidebar');

		if (!sidebar) {
			return;
		}

		sidebar.querySelectorAll('.custom-logo-link, .elementor-widget-theme-site-logo a, .elementor-widget-image a').forEach(function (link) {
			link.href = homeUrl;
			link.setAttribute('aria-label', 'Terug naar hoofdcategorieën');
		});

		sidebar.querySelectorAll('.custom-logo, .elementor-widget-theme-site-logo img, .elementor-widget-image img').forEach(function (logo) {
			if (logo.closest('a')) {
				logo.closest('a').href = homeUrl;
				return;
			}

			const link = document.createElement('a');
			link.className = 'dewit-sidebar-logo-link';
			link.href = homeUrl;
			link.setAttribute('aria-label', 'Terug naar hoofdcategorieën');
			logo.parentNode.insertBefore(link, logo);
			link.appendChild(logo);
		});
	}

	function updateProductViewSwitchLabel() {
		const label = document.querySelector('.dewit-product-view-switch__label');

		if (label) {
			label.textContent = getActiveParentCategoryLabel();
		}
	}

	function injectProductViewSwitch(content, grid) {
		if (content.querySelector('.dewit-product-view-switch')) {
			updateProductViewSwitchLabel();
			setProductCardViewMode(getProductCardViewMode());
			return;
		}

		const switcher = document.createElement('div');
		const label = document.createElement('span');
		const controls = document.createElement('span');
		const gridButton = document.createElement('button');
		const horizontalButton = document.createElement('button');
		const tableButton = document.createElement('button');

		switcher.className = 'dewit-product-view-switch';
		switcher.setAttribute('aria-label', 'Productweergave');

		label.className = 'dewit-product-view-switch__label';
		label.textContent = getActiveParentCategoryLabel();

		controls.className = 'dewit-product-view-switch__controls';

		gridButton.className = 'dewit-product-view-switch__button';
		gridButton.type = 'button';
		gridButton.setAttribute('data-view', 'grid');
		gridButton.setAttribute('aria-label', 'Gridweergave');
		gridButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect></svg>';

		horizontalButton.className = 'dewit-product-view-switch__button';
		horizontalButton.type = 'button';
		horizontalButton.setAttribute('data-view', 'horizontal');
		horizontalButton.setAttribute('aria-label', 'Horizontale productcards');
		horizontalButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="5" x="3" y="4" rx="1"></rect><rect width="18" height="5" x="3" y="15" rx="1"></rect></svg>';

		tableButton.className = 'dewit-product-view-switch__button';
		tableButton.type = 'button';
		tableButton.setAttribute('data-view', 'table');
		tableButton.setAttribute('aria-label', 'Tabelweergave');
		tableButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M3 12h18"></path><path d="M3 18h18"></path><path d="M8 6v12"></path></svg>';

		[gridButton, horizontalButton, tableButton].forEach(function (button) {
			button.addEventListener('click', function () {
				setProductCardViewMode(button.getAttribute('data-view'), true);
			});
			controls.appendChild(button);
		});

		switcher.appendChild(label);
		switcher.appendChild(controls);

		const toolbar = content.querySelector('.dewit-shop-toolbar');

		if (toolbar) {
			toolbar.appendChild(switcher);
		} else {
			content.insertBefore(switcher, grid);
		}

		setProductCardViewMode(getProductCardViewMode());
	}

	function clearLiveSearchResults(results) {
		results.classList.remove('is-visible', 'is-loading');
		results.innerHTML = '';
	}

	function renderLiveSearchResults(results, items, searchTerm) {
		results.classList.remove('is-loading');
		results.innerHTML = '';

		if (!items.length) {
			const empty = document.createElement('div');
			empty.className = 'dewit-shop-search-results__empty';
			empty.textContent = 'Geen directe resultaten gevonden';
			results.appendChild(empty);
			results.classList.add('is-visible');
			return;
		}

		items.forEach(function (item) {
			const link = document.createElement('a');
			const image = document.createElement('span');
			const content = document.createElement('span');
			const title = document.createElement('span');
			const meta = document.createElement('span');
			const metaParts = [
				{ label: item.sku, type: 'sku' },
				{ label: item.categories, type: 'category' },
			].filter(function (part) {
				return part.label;
			});

			link.className = 'dewit-shop-search-result';
			link.href = item.url;

			image.className = 'dewit-shop-search-result__image';

			if (item.image) {
				const img = document.createElement('img');
				img.alt = '';
				img.loading = 'lazy';
				img.src = item.image;
				image.appendChild(img);
			}

			content.className = 'dewit-shop-search-result__content';
			title.className = 'dewit-shop-search-result__title';
			title.textContent = normalizeDisplayText(item.title || searchTerm);
			meta.className = 'dewit-shop-search-result__meta';

			metaParts.forEach(function (part) {
				const itemElement = document.createElement('span');
				itemElement.className = 'dewit-shop-search-result__meta-item is-' + part.type;
				itemElement.textContent = normalizeDisplayText(part.label);
				meta.appendChild(itemElement);
			});

			content.appendChild(title);

			if (metaParts.length) {
				content.appendChild(meta);
			}

			link.appendChild(image);
			link.appendChild(content);
			results.appendChild(link);
		});

		results.classList.add('is-visible');
	}

	function updateLiveSearch(input, results) {
		const searchTerm = input.value.trim();
		const config = getThemeConfig();

		window.clearTimeout(searchDebounceTimer);

		if (searchRequestController) {
			searchRequestController.abort();
			searchRequestController = null;
		}

		if (searchTerm.length < 2 || !config.ajaxUrl) {
			clearLiveSearchResults(results);
			return;
		}

		searchDebounceTimer = window.setTimeout(function () {
			const url = new URL(config.ajaxUrl);
			url.searchParams.set('action', 'dewit_product_search');
			url.searchParams.set('term', searchTerm);

			searchRequestController = new AbortController();
			results.classList.add('is-visible', 'is-loading');
			results.innerHTML = '<div class="dewit-shop-search-results__empty">Zoeken...</div>';

			window.fetch(url.toString(), {
				credentials: 'same-origin',
				signal: searchRequestController.signal,
			})
				.then(function (response) {
					return response.json();
				})
				.then(function (payload) {
					renderLiveSearchResults(results, payload && payload.data ? payload.data : [], searchTerm);
				})
				.catch(function (error) {
					if (error.name !== 'AbortError') {
						clearLiveSearchResults(results);
					}
				});
		}, 180);
	}

	function injectShopToolbar() {
		const content = document.querySelector('.elementor-element-5c7860e');
		const grid = content ? content.querySelector('.elementor-widget-loop-grid') : null;

		if (!content || !grid || content.querySelector('.dewit-shop-toolbar')) {
			return;
		}

		const toolbar = document.createElement('div');
		const logo = document.createElement('a');
		const logoImage = document.createElement('img');
		const form = document.createElement('form');
		const label = document.createElement('span');
		const input = document.createElement('input');
		const button = document.createElement('button');
		const results = document.createElement('div');
		const categoryToggle = document.createElement('button');
		const email = document.createElement('a');
		const phone = document.createElement('a');
		const params = new URL(window.location.href).searchParams;
		const config = getThemeConfig();

		toolbar.className = 'dewit-shop-toolbar';

		logo.className = 'dewit-shop-toolbar-logo';
		logo.href = config.homeUrl || window.location.origin + '/';
		logo.setAttribute('aria-label', 'De Wit Bouwmachines');

		if (config.logoUrl) {
			logoImage.src = config.logoUrl;
			logoImage.alt = 'De Wit Bouwmachines';
			logoImage.decoding = 'async';
			logo.appendChild(logoImage);
		} else {
			logo.textContent = 'De Wit';
		}

		form.className = 'dewit-shop-search';
		form.method = 'get';
		form.action = window.location.origin + '/';

		label.className = 'screen-reader-text';
		label.textContent = 'Zoeken naar producten';

		input.type = 'search';
		input.name = 's';
		input.placeholder = 'Zoeken naar producten';
		input.value = params.get('s') || '';

		button.type = 'submit';
		button.setAttribute('aria-label', 'Zoeken');
		button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';

		results.className = 'dewit-shop-search-results';
		results.setAttribute('role', 'listbox');

		input.setAttribute('autocomplete', 'off');
		input.setAttribute('aria-autocomplete', 'list');

		input.addEventListener('input', function () {
			updateLiveSearch(input, results);
		});

		input.addEventListener('focus', function () {
			updateLiveSearch(input, results);
		});

		document.addEventListener('click', function (event) {
			if (!form.contains(event.target)) {
				clearLiveSearchResults(results);
			}
		});

		form.addEventListener('submit', function () {
			const postType = form.querySelector('input[name="post_type"]');

			if (!postType) {
				const hidden = document.createElement('input');
				hidden.type = 'hidden';
				hidden.name = 'post_type';
				hidden.value = 'product';
				form.appendChild(hidden);
			}
		});

		email.className = 'dewit-shop-email';
		email.href = 'mailto:info@dewitbouwmachines.nl';
		email.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg><span>info@dewitbouwmachines.nl</span>';

		phone.className = 'dewit-shop-phone';
		phone.href = 'tel:+31412634969';
		phone.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8 9.69a16 16 0 0 0 6.31 6.31l1.25-1.25a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92Z"></path></svg><span>0412 - 63 49 69</span>';

		categoryToggle.className = 'dewit-category-toggle';
		categoryToggle.type = 'button';
		categoryToggle.setAttribute('aria-expanded', 'false');
		categoryToggle.setAttribute('aria-controls', 'catalog-sidebar');
		categoryToggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M7 12h10"></path><path d="M10 18h4"></path></svg><span>Categorieën</span>';

		form.appendChild(label);
		form.appendChild(input);
		form.appendChild(button);
		form.appendChild(results);
		toolbar.appendChild(logo);
		toolbar.appendChild(form);
		toolbar.appendChild(email);
		toolbar.appendChild(categoryToggle);
		toolbar.appendChild(phone);
		content.insertBefore(toolbar, grid);
		injectProductViewSwitch(content, grid);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', injectShopToolbar);
		document.addEventListener('DOMContentLoaded', routeSidebarLogoToHome);
	} else {
		injectShopToolbar();
		routeSidebarLogoToHome();
	}

	window.addEventListener('elementor/frontend/init', injectShopToolbar);
	window.addEventListener('elementor/frontend/init', routeSidebarLogoToHome);
	window.addEventListener('load', routeSidebarLogoToHome);
	window.addEventListener('dewit/products-updated', function () {
		updateProductViewSwitchLabel();
		setProductCardViewMode(getProductCardViewMode());
	});
}());

(function () {
	let groupedProductsController = null;

	function getThemeConfig() {
		return window.dewitTheme || (typeof dewitTheme !== 'undefined' ? dewitTheme : {});
	}

	function normalizeDisplayText(value) {
		const normalized = String(value || '').replace(/&(\d{2,6});/g, '&#$1;');
		const parser = document.createElement('textarea');
		parser.innerHTML = normalized;

		return parser.value;
	}

	function getActiveFilterParamNames() {
		return Array.from(new URL(window.location.href).searchParams.keys())
			.filter(function (key) {
				return key.indexOf('e-filter-') === 0 || key === 'product_cat' || key === 'dewit_parent_cat';
			});
	}

	function getActiveCategorySlug() {
		const url = new URL(window.location.href);
		const activeParam = Array.from(url.searchParams.entries())
			.find(function (entry) {
				return (entry[0].indexOf('e-filter-') === 0 || entry[0] === 'product_cat') && entry[1];
			});

		return activeParam ? activeParam[1] : '';
	}

	function getActiveParentCategorySlug() {
		return new URL(window.location.href).searchParams.get('dewit_parent_cat') ||
			(getThemeConfig().defaultParentCategory || '');
	}

	function getProductGridWidget() {
		return document.querySelector('.elementor-widget-loop-grid');
	}

	function getProductLoopContainer() {
		const widget = getProductGridWidget();

		if (!widget) {
			return null;
		}

		let container = widget.querySelector('.elementor-loop-container');

		if (!container) {
			container = document.createElement('div');
			container.className = 'elementor-loop-container elementor-grid dewit-generated-loop-container';
			widget.appendChild(container);
		}

		return container;
	}

	function disableGroupedElementorLoadMore() {
		const widget = getProductGridWidget();

		if (!widget) {
			return;
		}

		widget.classList.add('dewit-grouped-widget');
		widget.querySelectorAll('.e-load-more-anchor, .e-load-more-spinner, .e-load-more-message')
			.forEach(function (element) {
				element.remove();
			});
	}

	function updateGroupedCategoryUrl(slug, mode) {
		const url = new URL(window.location.href);

		getActiveFilterParamNames().forEach(function (key) {
			url.searchParams.delete(key);
		});

		url.searchParams.delete('product-page');
		url.searchParams.set('dewit_parent_cat', slug);

		if (url.toString() === window.location.href) {
			return;
		}

		if (mode === 'replace') {
			window.history.replaceState({}, '', url.toString());
			return;
		}

		if (mode !== 'none') {
			window.history.pushState({}, '', url.toString());
		}
	}

	function getGroupedCategoryUrl(slug) {
		const url = new URL(window.location.href);

		getActiveFilterParamNames().forEach(function (key) {
			url.searchParams.delete(key);
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
			return false;
		}

		section.scrollIntoView({
			block: 'start',
			behavior: 'smooth',
		});

		return true;
	}

	function setActiveSidebarChild(slug) {
		document.querySelectorAll('.dewit-category-child[data-filter]').forEach(function (item) {
			item.setAttribute('aria-pressed', String(item.getAttribute('data-filter') === slug));
		});
	}

	function getGroupedProductsView() {
		const container = getProductLoopContainer();
		let view = container ? container.querySelector('.dewit-grouped-products') : null;

		if (!container) {
			return null;
		}

		if (!view) {
			view = document.createElement('div');
			view.className = 'dewit-grouped-products';
			container.innerHTML = '';
			container.appendChild(view);
		}

		container.classList.add('dewit-grouped-mode');
		container.style.display = 'block';
		view.style.display = 'grid';
		disableGroupedElementorLoadMore();

		return view;
	}

	function setGroupedProductsLoading(view) {
		view.classList.add('is-visible', 'is-loading');
		view.setAttribute('aria-busy', 'true');
		view.style.display = 'grid';

		if (!view.children.length) {
			view.innerHTML = '<div class="dewit-grouped-products__status">Producten laden...</div>';
		}
	}

	function renderGroupedProductCard(product, index) {
		const card = document.createElement('a');
		const imageWrap = document.createElement('span');
		const body = document.createElement('span');
		const sku = document.createElement('span');
		const title = document.createElement('span');
		const isPriorityImage = index < 4;
		const isLcpCandidate = index < 2;

		card.className = 'dewit-grouped-product-card';
		card.href = product.url;
		card.style.setProperty('--dewit-card-index', String(Math.min(index, 24)));

		imageWrap.className = 'dewit-grouped-product-card__image';

		if (product.image) {
			const image = document.createElement('img');
			image.alt = '';
			image.decoding = 'async';
			image.loading = isPriorityImage ? 'eager' : 'lazy';
			image.fetchPriority = isLcpCandidate ? 'high' : 'low';
			image.width = product.image_width || 300;
			image.height = product.image_height || 300;
			image.src = product.image;
			imageWrap.appendChild(image);
		}

		body.className = 'dewit-grouped-product-card__body';
		sku.className = 'dewit-grouped-product-card__sku';
		sku.textContent = normalizeDisplayText(product.sku || '');
		title.className = 'dewit-grouped-product-card__title';
		title.textContent = normalizeDisplayText(product.title || '');

		body.appendChild(sku);
		body.appendChild(title);
		card.appendChild(imageWrap);
		card.appendChild(body);

		return card;
	}

	function renderGroupedProducts(groups) {
		const view = getGroupedProductsView();
		const container = getProductLoopContainer();
		const fragment = document.createDocumentFragment();

		if (!view) {
			return;
		}

		view.classList.remove('is-loading');
		view.removeAttribute('aria-busy');
		view.classList.add('is-visible');
		view.style.display = 'grid';

		if (container) {
			container.classList.add('dewit-grouped-mode');
		}

		if (!groups.length) {
			const status = document.createElement('div');

			status.className = 'dewit-grouped-products__status';
			status.textContent = 'Geen producten gevonden';
			view.replaceChildren(status);
			window.dispatchEvent(new CustomEvent('dewit/products-updated'));
			return;
		}

		let productIndex = 0;

		groups.forEach(function (group) {
			const section = document.createElement('section');
			const heading = document.createElement('h2');
			const grid = document.createElement('div');

			section.className = 'dewit-grouped-products__section';
			section.id = getCategorySectionId(group.slug);
			section.setAttribute('data-category-slug', group.slug || '');
			heading.className = 'dewit-grouped-products__heading';
			heading.textContent = normalizeDisplayText(group.name);
			grid.className = 'dewit-grouped-products__grid';

			if ((group.products || []).length === 1) {
				grid.classList.add('is-single');
			}

			(group.products || []).forEach(function (product) {
				grid.appendChild(renderGroupedProductCard(product, productIndex));
				productIndex += 1;
			});

			section.appendChild(heading);
			section.appendChild(grid);
			fragment.appendChild(section);
		});

		view.replaceChildren(fragment);
		window.dispatchEvent(new CustomEvent('dewit/products-updated'));
	}

	function renderServerGroupedProducts() {
		const grouped = window.dewitGroupedCategory;

		if (!grouped || !grouped.html) {
			return;
		}

		const container = getProductLoopContainer();
		const view = getGroupedProductsView();

		if (!container || !view) {
			return;
		}

		if (container.querySelector('.dewit-grouped-products.is-visible')) {
			container.classList.add('dewit-grouped-mode');
			container.style.display = 'block';
			disableGroupedElementorLoadMore();
			updateGroupedCategoryUrl(grouped.slug, 'replace');
			window.dispatchEvent(new CustomEvent('dewit/products-updated'));
			return;
		}

		container.classList.add('dewit-grouped-mode');
		container.style.display = 'block';
		container.innerHTML = grouped.html;
		updateGroupedCategoryUrl(grouped.slug, 'replace');
		disableGroupedElementorLoadMore();
		window.dispatchEvent(new CustomEvent('dewit/products-updated'));
	}

	function loadGroupedCategoryProducts(group, options) {
		const config = getThemeConfig();
		const view = getGroupedProductsView();
		const container = getProductLoopContainer();
		const ajaxUrl = config.ajaxUrl || (window.location.origin + '/wp-admin/admin-ajax.php');
		const loadOptions = options || {};

		if (!view) {
			return;
		}

		if (groupedProductsController) {
			groupedProductsController.abort();
		}

		if (container) {
			container.classList.add('dewit-grouped-mode');
		}

		disableGroupedElementorLoadMore();

		setGroupedProductsLoading(view);

		const url = new URL(ajaxUrl);
		url.searchParams.set('action', 'dewit_category_grouped_products');
		url.searchParams.set('category', group.parentSlug);

		groupedProductsController = new AbortController();

		window.fetch(url.toString(), {
			credentials: 'same-origin',
			signal: groupedProductsController.signal,
		})
			.then(function (response) {
				return response.json();
			})
			.then(function (payload) {
				const groups = payload && payload.data ? payload.data : [];

				window.requestAnimationFrame(function () {
					updateGroupedCategoryUrl(group.parentSlug, loadOptions.history || 'push');
					renderGroupedProducts(groups);
				});
			})
			.catch(function (error) {
				if (error.name !== 'AbortError') {
					view.classList.remove('is-loading');
					view.innerHTML = '<div class="dewit-grouped-products__status">Producten konden niet geladen worden</div>';
				}
			});
	}

	function closeMobileCategories() {
		document.body.classList.remove('dewit-mobile-filter-open');
		document.querySelectorAll('.dewit-category-toggle, .dewit-header-category-toggle').forEach(function (button) {
			button.setAttribute('aria-expanded', 'false');
		});
	}

	function getParentCategorySlugFromTrigger(trigger) {
		try {
			return new URL(trigger.href, window.location.href).searchParams.get('dewit_parent_cat') || '';
		} catch (error) {
			return '';
		}
	}

	function activateSidebarParentTrigger(trigger) {
		const filter = trigger.closest('.e-filter');
		const groupElement = trigger.closest('.dewit-category-group');

		if (!filter || !groupElement) {
			return;
		}

		filter.querySelectorAll('.dewit-category-group.is-open').forEach(function (openGroup) {
			const openTrigger = openGroup.querySelector('.dewit-category-trigger');
			const openPanel = openGroup.querySelector('.dewit-category-panel');

			openGroup.classList.remove('is-open');

			if (openTrigger) {
				openTrigger.setAttribute('aria-pressed', 'false');
			}

			if (openPanel) {
				openPanel.hidden = true;
			}
		});

		groupElement.classList.add('is-open');
		trigger.setAttribute('aria-pressed', 'true');

		const panel = groupElement.querySelector('.dewit-category-panel');

		if (panel) {
			panel.hidden = false;
		}
	}

	function findParentCategoryTrigger(slug) {
		return Array.from(document.querySelectorAll('#catalog-sidebar .dewit-category-trigger')).find(function (trigger) {
			return getParentCategorySlugFromTrigger(trigger) === slug;
		}) || null;
	}

	function getParentCategoryLabelFromTrigger(trigger, fallbackSlug) {
		if (!trigger) {
			return fallbackSlug || '';
		}

		const label = trigger.querySelector('.dewit-category-label');

		return label ? label.textContent.trim() : trigger.textContent.trim();
	}

	function handleCategoryHistoryNavigation() {
		if (document.body.classList.contains('single-product')) {
			return;
		}

		const slug = getActiveParentCategorySlug();

		if (!slug) {
			return;
		}

		const trigger = findParentCategoryTrigger(slug);
		const label = getParentCategoryLabelFromTrigger(trigger, slug);

		window.addEventListener('dewit/products-updated', function () {
			if (trigger) {
				activateSidebarParentTrigger(trigger);
			}

			window.dispatchEvent(new CustomEvent('dewit/category-selected', {
				detail: {
					label: label,
					slug: slug,
				},
			}));
		}, { once: true });

		loadGroupedCategoryProducts({
			label: label,
			name: label,
			parentSlug: slug,
		}, { history: 'none' });
	}

	function bindDelegatedParentCategorySwitches() {
		if (document.body.classList.contains('dewit-parent-switch-delegation-ready')) {
			return;
		}

		let switchId = 0;

		document.body.classList.add('dewit-parent-switch-delegation-ready');
		document.addEventListener('click', function (event) {
			const trigger = event.target.closest('#catalog-sidebar .dewit-category-trigger');

			if (!trigger || document.body.classList.contains('single-product')) {
				return;
			}

			const parentSlug = getParentCategorySlugFromTrigger(trigger);

			if (!parentSlug) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			const nextSwitchId = switchId + 1;
			const label = trigger.querySelector('.dewit-category-label') ?
				trigger.querySelector('.dewit-category-label').textContent.trim() :
				trigger.textContent.trim();

			switchId = nextSwitchId;

			window.addEventListener('dewit/products-updated', function () {
				if (nextSwitchId !== switchId) {
					return;
				}

				activateSidebarParentTrigger(trigger);
				window.dispatchEvent(new CustomEvent('dewit/category-selected', {
					detail: {
						label: label,
						slug: parentSlug,
					},
				}));
			}, { once: true });

			loadGroupedCategoryProducts({
				label: label,
				name: label,
				parentSlug: parentSlug,
			});
			closeMobileCategories();
		}, true);
	}

	function getMobileCategoryToggleButtons() {
		const buttons = Array.from(document.querySelectorAll('.dewit-category-toggle'));
		const sidebar = document.getElementById('catalog-sidebar');
		let headerToggle = document.querySelector('.dewit-header-category-toggle');
		const productHeaderToggle = document.body.classList.contains('single-product') ? document.querySelector('.site-header .menu-toggle') : null;
		const headerHost = document.querySelector('.elementor-element-c385f59.elementor-sticky--active:not(.elementor-sticky__spacer)') ||
			document.querySelector('.elementor-element-c385f59:not(.elementor-sticky__spacer)') ||
			document.querySelector('.site-header');

		if (!sidebar) {
			if (headerToggle && headerToggle.classList.contains('dewit-category-toggle-ready')) {
				headerToggle.remove();
			}

			return buttons;
		}

		if (!headerToggle && productHeaderToggle) {
			headerToggle = productHeaderToggle;
		}

		if (!headerToggle && headerHost) {
			headerToggle = document.createElement('button');
			headerToggle.className = 'menu-toggle dewit-header-category-toggle';
			headerToggle.type = 'button';
			headerToggle.innerHTML = '<span class="menu-toggle__bar"></span><span class="screen-reader-text">Categorieën openen</span>';
			headerHost.insertBefore(headerToggle, headerHost.firstChild);
		}

		if (headerToggle && sidebar) {
			headerToggle.classList.add('dewit-header-category-toggle');
			headerToggle.setAttribute('aria-controls', 'catalog-sidebar');
			headerToggle.setAttribute('aria-expanded', String(document.body.classList.contains('dewit-mobile-filter-open')));
			headerToggle.setAttribute('aria-label', 'Categorieën openen');
			buttons.push(headerToggle);
		}

		return buttons;
	}

	function injectMobileCategoryControls() {
		const toggles = getMobileCategoryToggleButtons();

		if (!toggles.length) {
			return;
		}

		let overlay = document.querySelector('.dewit-category-overlay');

		if (!overlay) {
			overlay = document.createElement('button');
			overlay.className = 'dewit-category-overlay';
			overlay.type = 'button';
			overlay.setAttribute('aria-label', 'Categorieën sluiten');
			document.body.appendChild(overlay);
		}

		toggles.forEach(function (toggle) {
			if (toggle.classList.contains('dewit-category-toggle-ready')) {
				return;
			}

			toggle.classList.add('dewit-category-toggle-ready');
		});

		if (!document.body.classList.contains('dewit-category-toggle-delegation-ready')) {
			document.body.classList.add('dewit-category-toggle-delegation-ready');
			document.addEventListener('click', function (event) {
				const toggle = event.target.closest('.dewit-category-toggle, .dewit-header-category-toggle');

				if (!toggle || !document.getElementById('catalog-sidebar')) {
					return;
				}

				event.preventDefault();

				const isOpen = document.body.classList.toggle('dewit-mobile-filter-open');

				getMobileCategoryToggleButtons().forEach(function (button) {
					button.setAttribute('aria-expanded', String(isOpen));
				});
			});
		}

		if (!overlay.classList.contains('dewit-category-overlay-ready')) {
			overlay.classList.add('dewit-category-overlay-ready');
			overlay.addEventListener('click', closeMobileCategories);
			document.addEventListener('keydown', function (event) {
				if (event.key === 'Escape') {
					closeMobileCategories();
				}
			});
		}
	}

	function enhanceShopNavigation() {
		bindDelegatedParentCategorySwitches();
		injectMobileCategoryControls();
	}

	function initServerGroupedProducts() {
		renderServerGroupedProducts();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enhanceShopNavigation);
		document.addEventListener('DOMContentLoaded', initServerGroupedProducts);
	} else {
		enhanceShopNavigation();
		initServerGroupedProducts();
	}

	window.addEventListener('elementor/frontend/init', enhanceShopNavigation);
	window.addEventListener('load', enhanceShopNavigation);
	window.addEventListener('popstate', handleCategoryHistoryNavigation);
	window.dewitGetActiveCategorySlug = getActiveCategorySlug;
	window.dewitGetActiveParentCategorySlug = getActiveParentCategorySlug;
	window.dewitGetGroupedCategoryUrl = getGroupedCategoryUrl;
	window.dewitLoadGroupedCategoryProducts = loadGroupedCategoryProducts;
	window.addEventListener('dewit/close-mobile-categories', closeMobileCategories);
}());

(function () {
	let productCardClickDelegationReady = false;

	function markImageLoaded(card, image) {
		function setLoaded() {
			card.classList.add('dewit-product-image-loaded');
		}

		if (image.complete) {
			setLoaded();
			return;
		}

		image.addEventListener('load', setLoaded, { once: true });
		image.addEventListener('error', setLoaded, { once: true });
	}

	function prepareProductCards(root) {
		const scope = root || document;
		const cards = [];

		if (scope.matches && scope.matches('.elementor-widget-loop-grid .e-loop-item.product')) {
			cards.push(scope);
		}

		if (scope.querySelectorAll) {
			scope.querySelectorAll('.elementor-widget-loop-grid .e-loop-item.product').forEach(function (card) {
				cards.push(card);
			});
		}

		cards.forEach(function (card) {
			const image = card.querySelector('img');
			const productUrl = getProductUrlFromCard(card);

			if (image) {
				image.loading = image.loading || 'lazy';
				image.decoding = 'async';
				markImageLoaded(card, image);
			}

			if (productUrl && !card.classList.contains('dewit-product-card-click-ready')) {
				card.classList.add('dewit-product-card-click-ready');
				card.setAttribute('role', 'link');
				card.tabIndex = 0;
				card.addEventListener('keydown', function (event) {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						window.location.href = getProductUrlFromCard(card);
					}
				});
			}

			if (card.classList.contains('dewit-product-card-ready')) {
				return;
			}

			card.classList.add('dewit-product-card-ready');

			window.requestAnimationFrame(function () {
				card.classList.add('is-visible');
			});
		});
	}

	function getProductUrlFromCard(card) {
		const productLink = Array.from(card.querySelectorAll('a[href]'))
			.find(function (link) {
				const href = link.getAttribute('href') || '';

				return href && href !== '#' && href.indexOf('elementor-action') === -1;
			});
		const productId = getProductIdFromCard(card);

		if (productLink) {
			return productLink.href;
		}

		return productId ? '/?post_type=product&p=' + productId : '';
	}

	function getClosestProductCard(target) {
		const element = target && target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;

		return element ? element.closest('.elementor-widget-loop-grid .e-loop-item.product') : null;
	}

	function getProductIdFromCard(card) {
		const match = String(card.className).match(/(?:^|\s)post-(\d+)(?:\s|$)/);

		return match ? match[1] : '';
	}

	function isInteractiveCardTarget(target) {
		const element = target && target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;

		return Boolean(element && element.closest('a, button, input, select, textarea, label'));
	}

	function installProductCardClickDelegation() {
		if (productCardClickDelegationReady) {
			return;
		}

		productCardClickDelegationReady = true;
		document.addEventListener('click', function (event) {
			const card = getClosestProductCard(event.target);

			if (!card || isInteractiveCardTarget(event.target)) {
				return;
			}

			const productUrl = getProductUrlFromCard(card);

			if (!productUrl) {
				return;
			}

			event.preventDefault();
			window.location.href = productUrl;
		}, true);
	}

	function watchProductGrid() {
		if (document.querySelector('.dewit-grouped-products.is-visible')) {
			return;
		}

		const containers = document.querySelectorAll('.elementor-widget-loop-grid .elementor-loop-container');

		installProductCardClickDelegation();
		prepareProductCards(document);

		containers.forEach(function (container) {
			if (container.classList.contains('dewit-product-grid-watched')) {
				return;
			}

			container.classList.add('dewit-product-grid-watched');

			const observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					mutation.addedNodes.forEach(function (node) {
						if (node.nodeType === Node.ELEMENT_NODE) {
							prepareProductCards(node);
							window.dispatchEvent(new CustomEvent('dewit/products-updated'));
						}
					});
				});
			});

			observer.observe(container, {
				childList: true,
				subtree: true,
			});
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', watchProductGrid);
	} else {
		watchProductGrid();
	}

	window.addEventListener('elementor/frontend/init', watchProductGrid);
	window.addEventListener('load', watchProductGrid);
}());

(function () {
	function preserveProductCategoryContext() {
		const parentSlug = new URL(window.location.href).searchParams.get('dewit_parent_cat');

		if (!parentSlug) {
			return;
		}

		document.querySelectorAll('body.single-product .related.products a[href*="/product/"]').forEach(function (link) {
			try {
				const url = new URL(link.href);

				url.searchParams.set('dewit_parent_cat', parentSlug);
				link.href = url.toString();
			} catch (error) {
				// Ignore malformed links from third-party markup.
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', preserveProductCategoryContext);
	} else {
		preserveProductCategoryContext();
	}
}());

(function () {
	let categoryTreePromise = null;
	const categoryCacheKey = 'dewitProductCategoriesWithProducts';
	const categoryCacheMaxAge = 12 * 60 * 60 * 1000;

	function getCachedCategoryGroups() {
		try {
			const cached = JSON.parse(window.localStorage.getItem(categoryCacheKey) || 'null');

			if (!cached || !Array.isArray(cached.categories) || Date.now() - cached.timestamp > categoryCacheMaxAge) {
				return [];
			}

			return buildGroupsFromCategories(cached.categories);
		} catch (error) {
			return [];
		}
	}

	function cacheCategories(categories) {
		try {
			window.localStorage.setItem(categoryCacheKey, JSON.stringify({
				categories: categories,
				timestamp: Date.now(),
			}));
		} catch (error) {
			// Storage can be unavailable in private browsing; the live API remains the fallback.
		}
	}

	function getInlineCategoryGroups() {
		const categories = Array.isArray(window.dewitProductCategories)
			? window.dewitProductCategories
			: Object.values(window.dewitProductCategories || {});

		if (!categories.length) {
			return [];
		}

		return buildGroupsFromCategories(categories);
	}

	function fetchCategoryTree() {
		if (categoryTreePromise) {
			return categoryTreePromise;
		}

		categoryTreePromise = fetch('/wp-json/wc/store/v1/products/categories?per_page=100', {
			credentials: 'same-origin',
			headers: {
				Accept: 'application/json',
			},
		})
			.then(function (response) {
				if (!response.ok) {
					throw new Error('Could not load product categories.');
				}

				return response.json();
			})
			.then(function (categories) {
				cacheCategories(categories);
				return buildGroupsFromCategories(categories);
			})
			.catch(function () {
				return [];
			});

		return categoryTreePromise;
	}

	function buildGroupsFromCategories(categories) {
		const categoriesWithProducts = getCategoriesWithProducts(categories)
			.filter(function (category) {
				return category.slug !== 'alle' && String(category.name || '').trim().toLowerCase() !== 'alle';
			});
		const childrenByParent = new Map();
		const categoryBySlug = new Map();

		categoriesWithProducts.forEach(function (category) {
			categoryBySlug.set(category.slug, category);

			if (!childrenByParent.has(category.parent)) {
				childrenByParent.set(category.parent, []);
			}

			childrenByParent.get(category.parent).push(category);
		});

		childrenByParent.forEach(function (children) {
			children.sort(function (a, b) {
				return a.name.localeCompare(b.name, 'nl');
			});
		});

		return (childrenByParent.get(0) || [])
			.map(function (parent) {
				const children = (childrenByParent.get(parent.id) || []).filter(function (child) {
					return child.slug !== 'alle' && String(child.name || '').trim().toLowerCase() !== 'alle';
				});

				return {
					label: parent.name,
					parentSlug: parent.slug,
					count: parent.count,
					productCount: children.reduce(function (total, child) {
						return total + Number(child.count || 0);
					}, Number(parent.count || 0)),
					image: getCategoryImage(parent),
					slugs: getDescendantSlugs(parent.id, childrenByParent),
					children: children.map(function (child) {
						return {
							name: child.name,
							slug: child.slug,
							count: child.count,
						};
					}),
					categoriesBySlug: categoryBySlug,
				};
			})
			.filter(function (group) {
				return group.slugs.length;
			});
	}

	function getCategoriesWithProducts(categories) {
		const childrenByParent = new Map();

		categories.forEach(function (category) {
			if (!childrenByParent.has(category.parent)) {
				childrenByParent.set(category.parent, []);
			}

			childrenByParent.get(category.parent).push(category);
		});

		function hasProducts(category) {
			const children = childrenByParent.get(category.id) || [];

			return Number(category.count) > 0 || children.some(hasProducts);
		}

		return categories.filter(hasProducts);
	}

	function getCategoryImage(category) {
		const image = category ? category.image : null;
		const placeholder = (window.dewitTheme && window.dewitTheme.placeholderImage) || null;

		if (!image) {
			return placeholder;
		}

		if (typeof image === 'string') {
			return {
				src: image,
				width: 300,
				height: 300,
			};
		}

		return {
			src: image.src || image.thumbnail || image.url || (placeholder ? placeholder.src : ''),
			width: image.width || 300,
			height: image.height || 300,
		};
	}

	function getDescendantSlugs(parentId, childrenByParent) {
		const children = childrenByParent.get(parentId) || [];

		return children.flatMap(function (child) {
			return [child.slug].concat(getDescendantSlugs(child.id, childrenByParent));
		});
	}

	function appendCategoryTriggerContent(trigger, group) {
		const label = document.createElement('span');

		label.className = 'dewit-category-label';
		label.textContent = group.label || group.name || '';

		trigger.appendChild(label);
	}

	function normalizeDisplayText(value) {
		const normalized = String(value || '').replace(/&(\d{2,6});/g, '&#$1;');
		const parser = document.createElement('textarea');
		parser.innerHTML = normalized;

		return parser.value;
	}

	function getLandingContainer() {
		const widget = document.querySelector('.elementor-widget-loop-grid');

		if (!widget) {
			return null;
		}

		let container = widget.querySelector('.elementor-loop-container');

		if (!container) {
			container = document.createElement('div');
			container.className = 'elementor-loop-container elementor-grid dewit-generated-loop-container';
			widget.appendChild(container);
		}

		return container;
	}

	function hasCategoryContext() {
		return Array.from(new URL(window.location.href).searchParams.keys()).some(function (key) {
			return key === 'dewit_parent_cat' || key === 'product_cat' || key.indexOf('e-filter-') === 0;
		});
	}

	function createLandingCard(group) {
		const card = document.createElement('a');
		const header = document.createElement('span');
		const content = document.createElement('span');
		const title = document.createElement('span');
		const description = document.createElement('span');
		const categoryImage = group.image || null;
		const childNames = (group.children || []).slice(0, 3).map(function (child) {
			return normalizeDisplayText(child.name);
		});

		card.className = 'dewit-category-landing-card';
		card.href = getGroupedCategoryUrl(group.parentSlug);
		header.className = 'dewit-category-landing-card__header';
		content.className = 'dewit-category-landing-card__content';
		title.className = 'dewit-category-landing-card__title';
		description.className = 'dewit-category-landing-card__description';

		title.textContent = normalizeDisplayText(group.label);
		description.textContent = childNames.length ? childNames.join(', ') : 'Bekijk alle producten in deze hoofdgroep';

		if (categoryImage && categoryImage.src) {
			const image = document.createElement('img');
			image.src = categoryImage.src;
			image.alt = '';
			image.width = categoryImage.width || 300;
			image.height = categoryImage.height || 300;
			image.loading = 'lazy';
			image.decoding = 'async';
			header.appendChild(image);
		}

		content.appendChild(title);
		content.appendChild(description);
		card.appendChild(header);
		card.appendChild(content);

		return card;
	}

	function renderCategoryLanding(groups) {
		const hasActiveCategoryContext = hasCategoryContext();
		const container = getLandingContainer();

		document.body.classList.toggle('dewit-shop-landing', !hasActiveCategoryContext);

		if (hasActiveCategoryContext || !container || !groups.length) {
			return;
		}

		const landing = document.createElement('div');
		const grid = document.createElement('div');

		landing.className = 'dewit-category-landing';
		grid.className = 'dewit-category-landing__grid';

		groups.forEach(function (group) {
			grid.appendChild(createLandingCard(group));
		});

		landing.appendChild(grid);
		container.innerHTML = '';
		container.classList.add('dewit-landing-mode');
		container.classList.remove('elementor-grid');
		container.classList.remove('dewit-grouped-mode');
		container.appendChild(landing);
	}

	function getRenderedSidebarGroups() {
		return Array.from(document.querySelectorAll('#catalog-sidebar .dewit-category-group')).map(function (groupElement) {
			const trigger = groupElement.querySelector('.dewit-category-trigger');
			const label = trigger ? trigger.querySelector('.dewit-category-label') : null;
			const href = trigger ? trigger.getAttribute('href') : '';
			let parentSlug = '';

			try {
				parentSlug = href ? new URL(href, window.location.href).searchParams.get('dewit_parent_cat') || '' : '';
			} catch (error) {
				parentSlug = '';
			}

			const children = Array.from(groupElement.querySelectorAll('.dewit-category-child[data-filter]')).map(function (child) {
				return {
					name: child.textContent.trim(),
					slug: child.getAttribute('data-filter') || '',
					count: 0,
				};
			}).filter(function (child) {
				return child.name && child.slug;
			});

			return {
				label: label ? label.textContent.trim() : '',
				parentSlug: parentSlug,
				count: 0,
				productCount: 0,
				slugs: children.map(function (child) {
					return child.slug;
				}),
				children: children,
			};
		}).filter(function (group) {
			return group.label && group.parentSlug;
		});
	}

	function renderCategoryLandingFromSidebar() {
		if (hasCategoryContext() || document.querySelector('.dewit-category-landing-card')) {
			return;
		}

		renderCategoryLanding(getRenderedSidebarGroups());
	}

	function getActiveCategorySlug() {
		if (window.dewitGetActiveCategorySlug) {
			return window.dewitGetActiveCategorySlug();
		}

		const url = new URL(window.location.href);
		const activeParam = Array.from(url.searchParams.entries())
			.find(function (entry) {
				return (entry[0].indexOf('e-filter-') === 0 || entry[0] === 'product_cat') && entry[1];
			});

		return activeParam ? activeParam[1] : '';
	}

	function getActiveParentCategorySlug() {
		if (window.dewitGetActiveParentCategorySlug) {
			return window.dewitGetActiveParentCategorySlug();
		}

		return new URL(window.location.href).searchParams.get('dewit_parent_cat') ||
			((window.dewitTheme && window.dewitTheme.defaultParentCategory) || '');
	}

	function getGroupedCategoryUrl(slug) {
		if (window.dewitGetGroupedCategoryUrl) {
			return window.dewitGetGroupedCategoryUrl(slug);
		}

		const url = new URL(window.location.href);
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
			return false;
		}

		section.scrollIntoView({
			block: 'start',
			behavior: 'smooth',
		});

		return true;
	}

	function setActiveSidebarChild(slug) {
		document.querySelectorAll('.dewit-category-child[data-filter]').forEach(function (item) {
			item.setAttribute('aria-pressed', String(item.getAttribute('data-filter') === slug));
		});
	}

	function loadGroupedCategoryProducts(group) {
		if (window.dewitLoadGroupedCategoryProducts) {
			window.dewitLoadGroupedCategoryProducts(group);
		}
	}

	function hasServerGroupedProductsForActiveParent(group) {
		const grouped = window.dewitGroupedCategory;

		return Boolean(
			group &&
			grouped &&
			grouped.html &&
			grouped.slug &&
			grouped.slug === group.parentSlug
		);
	}

	function getFilterParamName(filter) {
		const widget = filter.closest('.elementor-widget-taxonomy-filter');
		let loopId = '';
		let taxonomy = 'product_cat';

		if (widget) {
			try {
				const settings = JSON.parse(widget.getAttribute('data-settings') || '{}');
				loopId = settings.selected_element || '';
				taxonomy = settings.taxonomy || taxonomy;
			} catch (error) {
				loopId = '';
			}
		}

		if (loopId) {
			return 'e-filter-' + loopId + '-' + taxonomy;
		}

		const existingParam = Array.from(new URL(window.location.href).searchParams.keys())
			.find(function (key) {
				return key.indexOf('e-filter-') === 0 && key.indexOf('-' + taxonomy) > -1;
			});

		return existingParam || 'e-filter-' + taxonomy;
	}

	function createGeneratedFilterItem(category, filter) {
		const item = document.createElement('button');
		const filterParamName = getFilterParamName(filter);

		item.className = 'e-filter-item dewit-generated-filter';
		item.type = 'button';
		item.setAttribute('data-filter', category.slug);
		item.setAttribute('aria-pressed', String(isSlugActive(category.slug)));
		item.textContent = category.name;

		item.addEventListener('click', function () {
			updateSelectedCategoryContext(category.slug, category.name);
			closeMobileCategoryDrawer();

			const url = new URL(window.location.href);
			url.searchParams.set(filterParamName, category.slug);
			url.searchParams.delete('product-page');
			window.location.href = url.toString();
		});

		return item;
	}

	function createCategoryChildItem(category, group) {
		const item = document.createElement('button');

		item.className = 'dewit-category-child';
		item.type = 'button';
		item.setAttribute('data-filter', category.slug);
		item.setAttribute('aria-pressed', 'false');
		item.textContent = normalizeDisplayText(category.name);

		item.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopPropagation();
			closeMobileCategoryDrawer();
			setActiveSidebarChild(category.slug);

			if (getActiveParentCategorySlug() === group.parentSlug && scrollToCategorySection(category.slug)) {
				return;
			}

			window.addEventListener('dewit/products-updated', function () {
				scrollToCategorySection(category.slug);
			}, { once: true });
			loadGroupedCategoryProducts(group);
		});

		return item;
	}

	function closeMobileCategoryDrawer() {
		window.dispatchEvent(new CustomEvent('dewit/close-mobile-categories'));
	}

	function updateSelectedCategoryContext(slug, label) {
		window.dispatchEvent(new CustomEvent('dewit/category-selected', {
			detail: {
				label: label,
				slug: slug,
			},
		}));
	}

	function closeDrawerOnFilterClick(item) {
		if (item.classList.contains('dewit-close-drawer-ready')) {
			return;
		}

		item.classList.add('dewit-close-drawer-ready');
		item.addEventListener('click', function () {
			updateSelectedCategoryContext(item.getAttribute('data-filter'), item.textContent.trim());
			closeMobileCategoryDrawer();
		});
	}

	function isItemActive(item) {
		return isSlugActive(item.getAttribute('data-filter')) ||
			item.getAttribute('aria-pressed') === 'true';
	}

	function isSlugActive(slug) {
		const url = new URL(window.location.href);

		return Array.from(url.searchParams.values()).includes(slug);
	}

	function renderCategoryFilters(groups) {
		const filters = document.querySelectorAll('.elementor-widget-taxonomy-filter .e-filter');

		filters.forEach(function (filter) {
			if (filter.classList.contains('dewit-category-dropdowns-ready')) {
				return;
			}

			let categorySwitchId = 0;
			const items = Array.from(filter.children)
				.filter(function (item) {
					return item.classList && item.classList.contains('e-filter-item');
				})
				.filter(function (item) {
					const slug = item.getAttribute('data-filter') || '';
					const label = item.textContent.trim().toLowerCase();

					return slug !== '__all' && slug !== '*' && label !== 'alle' && label !== 'alle producten';
				});

			const itemsBySlug = new Map();
			items.forEach(function (item) {
				itemsBySlug.set(item.getAttribute('data-filter'), item);
			});

			const fragment = document.createDocumentFragment();

			groups.forEach(function (group) {
				const groupElement = document.createElement('div');
				const trigger = document.createElement('a');
				const activeSlug = getActiveCategorySlug();
				const startsOpen = getActiveParentCategorySlug() === group.parentSlug || group.slugs.indexOf(activeSlug) > -1;

				groupElement.className = 'dewit-category-group';
				groupElement.classList.toggle('is-open', startsOpen);

				trigger.className = 'dewit-category-trigger';
				trigger.href = getGroupedCategoryUrl(group.parentSlug);
				trigger.setAttribute('aria-pressed', startsOpen ? 'true' : 'false');
				appendCategoryTriggerContent(trigger, group);

				trigger.addEventListener('click', function (event) {
					event.preventDefault();

					if (window.dewitLoadGroupedCategoryProducts && !document.body.classList.contains('single-product')) {
						const label = group.label || group.name || trigger.textContent.trim();
						const switchId = categorySwitchId + 1;

						categorySwitchId = switchId;

						window.addEventListener('dewit/products-updated', function () {
							if (switchId !== categorySwitchId) {
								return;
							}

							activateParentGroup(filter, groupElement, trigger);
							updateSelectedCategoryContext(group.parentSlug, label);
						}, { once: true });

						loadGroupedCategoryProducts(group);
						closeMobileCategoryDrawer();
						return;
					}

					activateParentGroup(filter, groupElement, trigger);
					window.location.href = trigger.href;
				});

				groupElement.appendChild(trigger);

				if (Array.isArray(group.children) && group.children.length) {
					const panel = document.createElement('div');
					panel.className = 'dewit-category-panel';
					panel.hidden = !startsOpen;

					group.children.forEach(function (child) {
						panel.appendChild(createCategoryChildItem(child, group));
					});

					groupElement.appendChild(panel);
				}

				fragment.appendChild(groupElement);
			});

			filter.innerHTML = '';
			filter.appendChild(fragment);
			filter.classList.add('dewit-category-dropdowns-ready');
			window.dispatchEvent(new CustomEvent('dewit/categories-ready'));

			const activeParentSlug = getActiveParentCategorySlug() || getActiveCategorySlug();
			const activeParentGroup = activeParentSlug
				? groups.find(function (group) {
					return group.parentSlug === activeParentSlug || group.slugs.indexOf(activeParentSlug) > -1;
				})
				: null;

			if (activeParentGroup) {
				if (hasServerGroupedProductsForActiveParent(activeParentGroup)) {
					if (window.dewitLoadGroupedCategoryProducts) {
						window.dispatchEvent(new CustomEvent('dewit/products-updated'));
					}

					return;
				}

				loadGroupedCategoryProducts(activeParentGroup);
			}
		});
	}

	function activateParentGroup(filter, groupElement, trigger) {
		filter.querySelectorAll('.dewit-category-group.is-open').forEach(function (openGroup) {
			openGroup.classList.remove('is-open');
			const openTrigger = openGroup.querySelector('.dewit-category-trigger');
			const openPanel = openGroup.querySelector('.dewit-category-panel');

			if (openTrigger) {
				openTrigger.setAttribute('aria-pressed', 'false');
			}

			if (openPanel) {
				openPanel.hidden = true;
			}
		});

		groupElement.classList.add('is-open');
		trigger.setAttribute('aria-pressed', 'true');

		const panel = groupElement.querySelector('.dewit-category-panel');

		if (panel) {
			panel.hidden = false;
		}
	}

	function revealCategoryFilters() {
		document.querySelectorAll('#catalog-sidebar .elementor-widget-taxonomy-filter .e-filter')
			.forEach(function (filter) {
				filter.classList.add('dewit-category-dropdowns-ready');
			});
	}

	function buildCategoryDropdowns() {
		const filters = document.querySelectorAll('.elementor-widget-taxonomy-filter .e-filter');

		if (!filters.length) {
			const inlineGroups = getInlineCategoryGroups();

			if (inlineGroups.length) {
				renderCategoryLanding(inlineGroups);
			}

			return;
		}

		const cachedGroups = getCachedCategoryGroups();
		const inlineGroups = getInlineCategoryGroups();

		if (inlineGroups.length) {
			renderCategoryFilters(inlineGroups);
			renderCategoryLanding(inlineGroups);
		} else if (cachedGroups.length) {
			renderCategoryFilters(cachedGroups);
			renderCategoryLanding(cachedGroups);
		}

		if (!inlineGroups.length && !cachedGroups.length) {
			fetchCategoryTree().then(function (groups) {
				if (!groups.length) {
					return;
				}

				renderCategoryFilters(groups);
				renderCategoryLanding(groups);
			});
		}
	}

	function getCleanCategoryUrl() {
		const url = new URL(window.location.href);

		Array.from(url.searchParams.keys()).forEach(function (key) {
			if (key.indexOf('e-filter-') === 0 || key === 'product_cat' || key === 'dewit_parent_cat') {
				url.searchParams.delete(key);
			}
		});

		url.searchParams.delete('product-page');

		return url.toString();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', buildCategoryDropdowns);
		document.addEventListener('DOMContentLoaded', function () {
			window.setTimeout(revealCategoryFilters, 700);
			window.setTimeout(renderCategoryLandingFromSidebar, 760);
		});
	} else {
		buildCategoryDropdowns();
		window.setTimeout(revealCategoryFilters, 700);
		window.setTimeout(renderCategoryLandingFromSidebar, 760);
	}

	window.addEventListener('elementor/frontend/init', buildCategoryDropdowns);
	window.addEventListener('load', revealCategoryFilters);
	window.addEventListener('load', renderCategoryLandingFromSidebar);
	window.addEventListener('dewit/categories-ready', renderCategoryLandingFromSidebar);
}());
