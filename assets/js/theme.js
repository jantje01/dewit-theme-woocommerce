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

		form.appendChild(label);
		form.appendChild(input);
		form.appendChild(button);
		toolbar.appendChild(form);
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
	let categoryTreePromise = null;

	function fetchCategoryTree() {
		if (categoryTreePromise) {
			return categoryTreePromise;
		}

		categoryTreePromise = fetch('/wp-json/wc/store/v1/products/categories', {
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
				return buildGroupsFromCategories(categories);
			})
			.catch(function () {
				return [];
			});

		return categoryTreePromise;
	}

	function buildGroupsFromCategories(categories) {
		const childrenByParent = new Map();
		const categoryBySlug = new Map();

		categories.forEach(function (category) {
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
			const url = new URL(window.location.href);
			url.searchParams.set(filterParamName, category.slug);
			url.searchParams.delete('product-page');
			window.location.href = url.toString();
		});

		return item;
	}

	function isItemActive(item) {
		return isSlugActive(item.getAttribute('data-filter')) ||
			item.getAttribute('aria-pressed') === 'true';
	}

	function isSlugActive(slug) {
		const url = new URL(window.location.href);

		return Array.from(url.searchParams.values()).includes(slug);
	}

	function buildCategoryDropdowns() {
		const filters = document.querySelectorAll('.elementor-widget-taxonomy-filter .e-filter');

		if (!filters.length) {
			return;
		}

		fetchCategoryTree().then(function (groups) {
			if (!groups.length) {
				return;
			}

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
				fragment.appendChild(item);
			});

			filter.innerHTML = '';
			filter.appendChild(fragment);
			filter.classList.add('dewit-category-dropdowns-ready');
		});
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', buildCategoryDropdowns);
	} else {
		buildCategoryDropdowns();
	}

	window.addEventListener('elementor/frontend/init', buildCategoryDropdowns);
}());
