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

	function getActiveFilterParamNames() {
		return Array.from(new URL(window.location.href).searchParams.keys())
			.filter(function (key) {
				return key.indexOf('e-filter-') === 0 || key === 'product_cat';
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
		const visibleCards = document.querySelectorAll('.elementor-widget-loop-grid .e-loop-item.product').length;

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
			const productId = getProductIdFromCard(card);

			if (image) {
				image.loading = image.loading || 'lazy';
				image.decoding = 'async';
				markImageLoaded(card, image);
			}

			if (productId && !card.querySelector('a')) {
				card.setAttribute('role', 'link');
				card.tabIndex = 0;
				card.addEventListener('click', function () {
					window.location.href = '/?post_type=product&p=' + productId;
				});
				card.addEventListener('keydown', function (event) {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						window.location.href = '/?post_type=product&p=' + productId;
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

	function getProductIdFromCard(card) {
		const match = String(card.className).match(/(?:^|\s)post-(\d+)(?:\s|$)/);

		return match ? match[1] : '';
	}

	function watchProductGrid() {
		const containers = document.querySelectorAll('.elementor-widget-loop-grid .elementor-loop-container');

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
		if (!Array.isArray(window.dewitProductCategories)) {
			return [];
		}

		return buildGroupsFromCategories(window.dewitProductCategories);
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
		const categoriesWithProducts = getCategoriesWithProducts(categories);
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

			const items = Array.from(filter.querySelectorAll(':scope > .e-filter-item'));

			if (!items.length) {
				return;
			}

			const itemsBySlug = new Map();
			items.forEach(function (item) {
				itemsBySlug.set(item.getAttribute('data-filter'), item);
			});

			const fragment = document.createDocumentFragment();
			const groupedItems = new Set();
			const allProducts = document.createElement('a');

			allProducts.className = 'dewit-all-products';
			allProducts.href = getCleanCategoryUrl();
			allProducts.textContent = 'Alle producten';
			allProducts.addEventListener('click', function () {
				updateSelectedCategoryContext('', 'Alle producten');
				closeMobileCategoryDrawer();
			});
			fragment.appendChild(allProducts);

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
				});

				groupElement.appendChild(trigger);
				groupElement.appendChild(panel);
				fragment.appendChild(groupElement);
			});

			const ungroupedItems = items.filter(function (item) {
				return !groupedItems.has(item);
			});

			ungroupedItems.forEach(function (item) {
				closeDrawerOnFilterClick(item);
				fragment.appendChild(item);
			});

			filter.innerHTML = '';
			filter.appendChild(fragment);
			filter.classList.add('dewit-category-dropdowns-ready');
			window.dispatchEvent(new CustomEvent('dewit/categories-ready'));
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
			if (key.indexOf('e-filter-') === 0 || key === 'product_cat') {
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
