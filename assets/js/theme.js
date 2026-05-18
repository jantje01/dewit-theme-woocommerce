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
	const groups = [
		{
			label: 'Steigermateriaal',
			slugs: ['onderdelen', 'buiskoppelingen', 'tube-lock', 'steigerdoeken'],
		},
		{
			label: 'Ondersteuningsmateriaal',
			slugs: ['schroefstempels', 'duw-trekstempels', 'stut-alone'],
		},
		{
			label: 'Afstandhouders',
			slugs: [
				'vezelbeton-afstandhouders',
				'stelribben-en-steltegels',
				'pe-buizen-en-konussen',
				'vloerstrips-en-hoeklijsten',
				'ringafstandhouders-afstandhouders',
			],
		},
		{
			label: 'Voegafdichting',
			slugs: ['kimband', 'voegkit-en-mortel', 'noppenmatten'],
		},
		{
			label: 'Transport en Opslag',
			slugs: [
				'stapelpallets-stapelpallets-en-opslag',
				'stapelbakken',
				'bouwhekpallets',
				'kruiwagens-stapelpallets-en-opslag',
				'kraancontainers',
				'platowagens',
			],
		},
		{
			label: 'Bouwmachines',
			slugs: ['betonmolens-bouwmachines'],
		},
		{
			label: 'Bouwelektra',
			slugs: ['verdeelkasten'],
		},
		{
			label: 'PBM',
			slugs: ['bouwhelmen', 'regenkleding'],
		},
		{
			label: 'Bouwhekken',
			slugs: ['bouwhekwielen'],
		},
	];

	function isItemActive(item) {
		const slug = item.getAttribute('data-filter');
		const url = new URL(window.location.href);

		return item.getAttribute('aria-pressed') === 'true' ||
			Array.from(url.searchParams.values()).includes(slug);
	}

	function buildCategoryDropdowns() {
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

			groups.forEach(function (group, index) {
				const matchingItems = group.slugs
					.map(function (slug) {
						return itemsBySlug.get(slug);
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
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', buildCategoryDropdowns);
	} else {
		buildCategoryDropdowns();
	}

	window.addEventListener('elementor/frontend/init', buildCategoryDropdowns);
}());
