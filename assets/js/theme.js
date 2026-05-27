(function () {
	const toggle = document.querySelector('.menu-toggle');
	const nav = document.querySelector('.main-navigation');

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
			title.textContent = item.title || searchTerm;
			meta.className = 'dewit-shop-search-result__meta';
			meta.textContent = [item.sku, item.categories].filter(Boolean).join(' | ');

			content.appendChild(title);

			if (meta.textContent) {
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
		const config = window.dewitTheme || {};

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
		const form = document.createElement('form');
		const label = document.createElement('span');
		const input = document.createElement('input');
		const button = document.createElement('button');
		const results = document.createElement('div');
		const categoryToggle = document.createElement('button');
		const phone = document.createElement('a');
		const params = new URL(window.location.href).searchParams;

		toolbar.className = 'dewit-shop-toolbar';

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
		button.textContent = 'Zoeken';

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

		phone.className = 'dewit-shop-phone';
		phone.href = 'tel:+31412634969';
		phone.textContent = '0412 - 63 49 69';

		categoryToggle.className = 'dewit-category-toggle';
		categoryToggle.type = 'button';
		categoryToggle.setAttribute('aria-expanded', 'false');
		categoryToggle.setAttribute('aria-controls', 'catalog-sidebar');
		categoryToggle.textContent = 'Categorieen';

		form.appendChild(label);
		form.appendChild(input);
		form.appendChild(button);
		form.appendChild(results);
		toolbar.appendChild(form);
		toolbar.appendChild(categoryToggle);
		toolbar.appendChild(phone);
		content.insertBefore(toolbar, grid);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', injectShopToolbar);
	} else {
		injectShopToolbar();
	}

	window.addEventListener('elementor/frontend/init', injectShopToolbar);
}());

(function () {
	let categoryLookupPromise = null;
	let selectedCategoryContext = null;
	let groupedProductsController = null;

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
		return new URL(window.location.href).searchParams.get('dewit_parent_cat') || '';
	}

	function formatCategorySlug(slug) {
		return slug
			.split('-')
			.filter(Boolean)
			.map(function (part) {
				return part.charAt(0).toUpperCase() + part.slice(1);
			})
			.join(' ');
	}

	function getCleanShopUrl() {
		const url = new URL(window.location.href);

		getActiveFilterParamNames().forEach(function (key) {
			url.searchParams.delete(key);
		});

		url.searchParams.delete('product-page');
		url.searchParams.delete('codex_grid');
		url.searchParams.delete('codex_heading');
		url.searchParams.delete('dewit_parent_cat');

		return url.toString();
	}

	function getActiveCategoryLabel() {
		const activeSlug = getActiveCategorySlug();
		const active = activeSlug
			? Array.from(document.querySelectorAll('#catalog-sidebar .e-filter-item'))
				.find(function (item) {
					return item.getAttribute('data-filter') === activeSlug;
				})
			: document.querySelector('#catalog-sidebar .e-filter-item[aria-pressed="true"]');

		if (active && active.textContent.trim()) {
			return active.textContent.trim();
		}

		if (activeSlug) {
			return formatCategorySlug(activeSlug);
		}

		return 'Alle producten';
	}

	function fetchCategoryLookup() {
		if (categoryLookupPromise) {
			return categoryLookupPromise;
		}

		categoryLookupPromise = fetch('/wp-json/wc/store/v1/products/categories?per_page=100', {
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
				return categories.reduce(function (lookup, category) {
					lookup[category.slug] = category.name;
					return lookup;
				}, {});
			})
			.catch(function () {
				return {};
			});

		return categoryLookupPromise;
	}

	function updateShopContext() {
		const context = document.querySelector('.dewit-shop-context');
		const title = context ? context.querySelector('.dewit-shop-context__title') : null;
		const count = context ? context.querySelector('.dewit-shop-context__count') : null;
		const reset = context ? context.querySelector('.dewit-shop-context__reset') : null;
		const groupedView = document.querySelector('.dewit-grouped-products.is-visible');
		const visibleCards = groupedView
			? groupedView.querySelectorAll('.dewit-grouped-product-card').length
			: document.querySelectorAll('.elementor-widget-loop-grid .e-loop-item.product').length;

		if (title) {
			title.textContent = selectedCategoryContext
				? selectedCategoryContext.label
				: getActiveCategoryLabel();
		}

		if (count) {
			count.textContent = visibleCards ? visibleCards + ' producten getoond' : 'Producten';
		}

		if (reset) {
			reset.href = getCleanShopUrl();
			reset.hidden = selectedCategoryContext
				? !selectedCategoryContext.slug
				: !getActiveFilterParamNames().length;
		}

		const activeSlug = getActiveCategorySlug();

		if (title && activeSlug && !selectedCategoryContext) {
			fetchCategoryLookup().then(function (lookup) {
				if (lookup[activeSlug]) {
					title.textContent = lookup[activeSlug];
				}
			});
		}
	}

	function setShopContextCategory(label, slug) {
		const context = document.querySelector('.dewit-shop-context');
		const title = context ? context.querySelector('.dewit-shop-context__title') : null;
		const reset = context ? context.querySelector('.dewit-shop-context__reset') : null;
		const selectedLabel = label || (slug ? formatCategorySlug(slug) : 'Alle producten');

		selectedCategoryContext = {
			label: selectedLabel,
			slug: slug,
		};

		if (title) {
			title.textContent = selectedLabel;
		}

		if (reset) {
			reset.href = getCleanShopUrl();
			reset.hidden = !slug;
		}
	}

	function getProductGridWidget() {
		return document.querySelector('.elementor-widget-loop-grid');
	}

	function getProductLoopContainer() {
		const widget = getProductGridWidget();

		return widget ? widget.querySelector('.elementor-loop-container') : null;
	}

	function updateGroupedCategoryUrl(slug) {
		const url = new URL(window.location.href);

		getActiveFilterParamNames().forEach(function (key) {
			url.searchParams.delete(key);
		});

		url.searchParams.delete('product-page');
		url.searchParams.set('dewit_parent_cat', slug);
		window.history.pushState({}, '', url.toString());
	}

	function getGroupedProductsView() {
		const widget = getProductGridWidget();
		let view = widget ? widget.querySelector('.dewit-grouped-products') : null;

		if (!widget) {
			return null;
		}

		if (!view) {
			view = document.createElement('div');
			view.className = 'dewit-grouped-products';
			widget.appendChild(view);
		}

		return view;
	}

	function setGroupedProductsLoading(view) {
		view.classList.add('is-visible', 'is-loading');
		view.innerHTML = '<div class="dewit-grouped-products__status">Producten laden...</div>';
	}

	function renderGroupedProductCard(product) {
		const card = document.createElement('a');
		const imageWrap = document.createElement('span');
		const body = document.createElement('span');
		const sku = document.createElement('span');
		const title = document.createElement('span');

		card.className = 'dewit-grouped-product-card';
		card.href = product.url;

		imageWrap.className = 'dewit-grouped-product-card__image';

		if (product.image) {
			const image = document.createElement('img');
			image.alt = '';
			image.decoding = 'async';
			image.loading = 'lazy';
			image.src = product.image;
			imageWrap.appendChild(image);
		}

		body.className = 'dewit-grouped-product-card__body';
		sku.className = 'dewit-grouped-product-card__sku';
		sku.textContent = product.sku || '';
		title.className = 'dewit-grouped-product-card__title';
		title.textContent = product.title || '';

		body.appendChild(sku);
		body.appendChild(title);
		card.appendChild(imageWrap);
		card.appendChild(body);

		return card;
	}

	function renderGroupedProducts(groups) {
		const view = getGroupedProductsView();
		const container = getProductLoopContainer();

		if (!view) {
			return;
		}

		view.classList.remove('is-loading');
		view.innerHTML = '';

		if (container) {
			container.hidden = true;
		}

		if (!groups.length) {
			view.innerHTML = '<div class="dewit-grouped-products__status">Geen producten gevonden</div>';
			return;
		}

		groups.forEach(function (group) {
			const section = document.createElement('section');
			const heading = document.createElement('h2');
			const grid = document.createElement('div');

			section.className = 'dewit-grouped-products__section';
			heading.className = 'dewit-grouped-products__heading';
			heading.textContent = group.name;
			grid.className = 'dewit-grouped-products__grid';

			(group.products || []).forEach(function (product) {
				grid.appendChild(renderGroupedProductCard(product));
			});

			section.appendChild(heading);
			section.appendChild(grid);
			view.appendChild(section);
		});

		window.dispatchEvent(new CustomEvent('dewit/products-updated'));
	}

	function loadGroupedCategoryProducts(group) {
		const config = window.dewitTheme || {};
		const view = getGroupedProductsView();
		const container = getProductLoopContainer();

		if (!config.ajaxUrl || !view) {
			return;
		}

		if (groupedProductsController) {
			groupedProductsController.abort();
		}

		if (container) {
			container.hidden = true;
		}

		setShopContextCategory(group.label, group.parentSlug);
		updateGroupedCategoryUrl(group.parentSlug);
		setGroupedProductsLoading(view);

		const url = new URL(config.ajaxUrl);
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
				renderGroupedProducts(payload && payload.data ? payload.data : []);
			})
			.catch(function (error) {
				if (error.name !== 'AbortError') {
					view.classList.remove('is-loading');
					view.innerHTML = '<div class="dewit-grouped-products__status">Producten konden niet geladen worden</div>';
				}
			});
	}

	function injectShopContext() {
		const content = document.querySelector('.elementor-element-5c7860e');
		const toolbar = content ? content.querySelector('.dewit-shop-toolbar') : null;
		const grid = content ? content.querySelector('.elementor-widget-loop-grid') : null;

		if (!content || !toolbar || !grid || content.querySelector('.dewit-shop-context')) {
			updateShopContext();
			return;
		}

		const context = document.createElement('div');
		const main = document.createElement('div');
		const title = document.createElement('strong');
		const count = document.createElement('span');
		const reset = document.createElement('a');

		context.className = 'dewit-shop-context';
		main.className = 'dewit-shop-context__main';
		title.className = 'dewit-shop-context__title';
		count.className = 'dewit-shop-context__count';
		reset.className = 'dewit-shop-context__reset';
		reset.textContent = 'Alle producten';

		main.appendChild(title);
		main.appendChild(count);
		context.appendChild(main);
		context.appendChild(reset);
		content.insertBefore(context, grid);
		updateShopContext();
	}

	function closeMobileCategories() {
		document.body.classList.remove('dewit-mobile-filter-open');
		document.querySelectorAll('.dewit-category-toggle').forEach(function (button) {
			button.setAttribute('aria-expanded', 'false');
		});
	}

	function injectMobileCategoryControls() {
		const toggle = document.querySelector('.dewit-category-toggle');

		if (!toggle || toggle.classList.contains('dewit-category-toggle-ready')) {
			return;
		}

		let overlay = document.querySelector('.dewit-category-overlay');

		if (!overlay) {
			overlay = document.createElement('button');
			overlay.className = 'dewit-category-overlay';
			overlay.type = 'button';
			overlay.setAttribute('aria-label', 'Categorieen sluiten');
			document.body.appendChild(overlay);
		}

		toggle.classList.add('dewit-category-toggle-ready');
		toggle.addEventListener('click', function () {
			const isOpen = document.body.classList.toggle('dewit-mobile-filter-open');
			toggle.setAttribute('aria-expanded', String(isOpen));
		});

		overlay.addEventListener('click', closeMobileCategories);
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') {
				closeMobileCategories();
			}
		});
	}

	function enhanceShopNavigation() {
		injectShopContext();
		injectMobileCategoryControls();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enhanceShopNavigation);
	} else {
		enhanceShopNavigation();
	}

	window.addEventListener('elementor/frontend/init', enhanceShopNavigation);
	window.addEventListener('load', enhanceShopNavigation);
	window.addEventListener('dewit/categories-ready', updateShopContext);
	window.addEventListener('dewit/category-selected', function (event) {
		setShopContextCategory(event.detail ? event.detail.label : '', event.detail ? event.detail.slug : '');
	});
	window.addEventListener('dewit/close-mobile-categories', closeMobileCategories);
	window.addEventListener('dewit/products-updated', updateShopContext);
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
				return {
					label: parent.name,
					parentSlug: parent.slug,
					slugs: getDescendantSlugs(parent.id, childrenByParent),
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

	function getDescendantSlugs(parentId, childrenByParent) {
		const children = childrenByParent.get(parentId) || [];

		return children.flatMap(function (child) {
			return [child.slug].concat(getDescendantSlugs(child.id, childrenByParent));
		});
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

			const items = Array.from(filter.querySelectorAll(':scope > .e-filter-item'))
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
			const groupedItems = new Set();

			groups.forEach(function (group, index) {
				const matchingItems = group.slugs
					.map(function (slug) {
						if (itemsBySlug.has(slug)) {
							return itemsBySlug.get(slug);
						}

						const category = group.categoriesBySlug.get(slug);
						return category ? createGeneratedFilterItem(category, filter) : null;
					})
					.filter(Boolean);

				if (!matchingItems.length) {
					return;
				}

				const groupElement = document.createElement('div');
				const trigger = document.createElement('button');
				const panel = document.createElement('div');
				const panelId = 'dewit-category-panel-' + index;
				const startsOpen = matchingItems.some(isItemActive);

				groupElement.className = 'dewit-category-group';
				groupElement.classList.toggle('is-open', startsOpen);

				trigger.className = 'dewit-category-trigger';
				trigger.type = 'button';
				trigger.setAttribute('aria-expanded', startsOpen ? 'true' : 'false');
				trigger.setAttribute('aria-controls', panelId);
				trigger.textContent = group.label;

				panel.className = 'dewit-category-panel';
				panel.id = panelId;
				panel.hidden = !startsOpen;

				matchingItems.forEach(function (item) {
					groupedItems.add(item);
					item.classList.add('dewit-category-child');
					closeDrawerOnFilterClick(item);
					panel.appendChild(item);
				});

				trigger.addEventListener('click', function () {
					const isOpen = groupElement.classList.toggle('is-open');
					trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
					panel.hidden = !isOpen;
					loadGroupedCategoryProducts(group);
				});

				groupElement.appendChild(trigger);
				groupElement.appendChild(panel);
				fragment.appendChild(groupElement);
			});

			filter.innerHTML = '';
			filter.appendChild(fragment);
			filter.classList.add('dewit-category-dropdowns-ready');
			window.dispatchEvent(new CustomEvent('dewit/categories-ready'));

			const activeParentSlug = getActiveParentCategorySlug() || getActiveCategorySlug();
			const activeParentGroup = activeParentSlug
				? groups.find(function (group) {
					return group.parentSlug === activeParentSlug;
				})
				: null;

			if (activeParentGroup) {
				loadGroupedCategoryProducts(activeParentGroup);
			}
		});
	}

	function buildCategoryDropdowns() {
		const filters = document.querySelectorAll('.elementor-widget-taxonomy-filter .e-filter');

		if (!filters.length) {
			return;
		}

		const cachedGroups = getCachedCategoryGroups();
		const inlineGroups = getInlineCategoryGroups();

		if (inlineGroups.length) {
			renderCategoryFilters(inlineGroups);
		} else if (cachedGroups.length) {
			renderCategoryFilters(cachedGroups);
		}

		fetchCategoryTree().then(function (groups) {
			if (!groups.length || inlineGroups.length || cachedGroups.length) {
				return;
			}

			renderCategoryFilters(groups);
		});
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
	} else {
		buildCategoryDropdowns();
	}

	window.addEventListener('elementor/frontend/init', buildCategoryDropdowns);
}());
