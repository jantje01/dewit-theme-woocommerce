# ERP variable product setup

This document describes how the ERP import should bundle separate ERP articles into WooCommerce variable products.

The theme can display WooCommerce products, but the actual product bundling belongs in the ERP/API sync. Do not convert products from the theme on page load, because that can change live catalog data unexpectedly.

## Goal

ERP articles that only differ by a selectable property, such as length, size, diameter, color, or execution, should become one WooCommerce variable product with one variation per ERP article.

Example:

```text
Parent product:
Hoeklijst met spijkerstrip

Variations:
- SKU 12345-15 | Lengte: 15 mm | 250 cm
- SKU 12345-25 | Lengte: 25 mm | 250 cm
- SKU 12345-30 | Lengte: 30 mm | 250 cm
```

## Required ERP fields

Every imported article should provide these fields:

| Field | Purpose |
| --- | --- |
| `sku` | Unique ERP article number. Becomes the WooCommerce variation SKU. |
| `group_key` | Stable key that links related ERP articles together. |
| `parent_sku` | Stable SKU for the WooCommerce parent product. Can be derived from `group_key`. |
| `parent_name` | Clean product name without the variable part. |
| `variation_attributes` | Selectable values such as length, size, diameter, color, or execution. |
| `regular_price` | Variation price. |
| `stock_quantity` | Variation stock. |
| `categories` | Product categories for the parent product. |
| `image_url` | Main image or variation image. |
| `description` | Parent product description. |

Recommended extra fields:

| Field | Purpose |
| --- | --- |
| `erp_id` | Original ERP identifier for traceability. |
| `sync_hash` | Detect whether an item changed since the last sync. |
| `is_active` | Draft or disable products that no longer exist in ERP. |

## Grouping rule

Use a deterministic `group_key`. The best source is an ERP product family or base article number.

If the ERP has no family field, create one by normalizing the product name:

```text
Original:
Hoeklijst met spijkerstrip 25 mm lgt 250 cm bundel 50 mtr

Parent name:
Hoeklijst met spijkerstrip

Variation attributes:
Maat: 25 mm
Lengte: 250 cm
Verpakking: bundel 50 mtr
```

Only group products when they are truly the same product with selectable differences. Keep them separate when the application, category, technical function, or product page content is different.

## WooCommerce model

Create one parent product:

- `type`: `variable`
- `sku`: parent SKU, not the ERP article SKU
- `attributes`: all selectable attributes with `variation: true`
- `categories`: assigned to the parent
- `images`: assigned to the parent

Create one variation per ERP article:

- `sku`: ERP article SKU
- `regular_price`: ERP price
- `stock_quantity`: ERP stock
- `manage_stock`: true when stock is synced
- `attributes`: selected values for this variation
- `image`: optional variation image

## REST API flow

1. Read or create the parent variable product by `parent_sku`.
2. Update the parent title, categories, description, image, and variation attributes.
3. Read existing variations for the parent.
4. Upsert each ERP article as a variation by `sku`.
5. Mark missing ERP variations as `draft`, `outofstock`, or delete them only if deletion is intentionally allowed.
6. Store `erp_id`, `group_key`, and `sync_hash` as meta data.

## Parent product payload

Endpoint:

```text
POST /wp-json/wc/v3/products
PUT /wp-json/wc/v3/products/{product_id}
```

Example:

```json
{
  "name": "Hoeklijst met spijkerstrip",
  "type": "variable",
  "sku": "ERP-GROUP-HOEKLIJST-SPIJKERSTRIP",
  "description": "Hoeklijst met spijkerstrip in meerdere maten.",
  "short_description": "Kies de gewenste maat.",
  "categories": [
    { "id": 123 }
  ],
  "images": [
    { "src": "https://example.com/images/hoeklijst.jpg" }
  ],
  "attributes": [
    {
      "name": "Maat",
      "visible": true,
      "variation": true,
      "options": ["15 mm", "25 mm", "30 mm"]
    },
    {
      "name": "Lengte",
      "visible": true,
      "variation": true,
      "options": ["250 cm"]
    }
  ],
  "meta_data": [
    { "key": "_dewit_erp_group_key", "value": "hoeklijst-spijkerstrip" },
    { "key": "_dewit_sync_source", "value": "erp" }
  ]
}
```

## Variation payload

Endpoint:

```text
POST /wp-json/wc/v3/products/{product_id}/variations
PUT /wp-json/wc/v3/products/{product_id}/variations/{variation_id}
```

Example:

```json
{
  "sku": "12345-25",
  "regular_price": "12.50",
  "manage_stock": true,
  "stock_quantity": 40,
  "stock_status": "instock",
  "attributes": [
    { "name": "Maat", "option": "25 mm" },
    { "name": "Lengte", "option": "250 cm" }
  ],
  "image": {
    "src": "https://example.com/images/hoeklijst-25mm.jpg"
  },
  "meta_data": [
    { "key": "_dewit_erp_id", "value": "12345-25" },
    { "key": "_dewit_erp_group_key", "value": "hoeklijst-spijkerstrip" }
  ]
}
```

## Upsert strategy

Use this matching order:

1. Parent: find product by parent SKU.
2. Variation: find variation by ERP article SKU.
3. Never match only by title, because titles can change and can be duplicated.

Suggested pseudo flow:

```text
for each group in ERP grouped articles:
  parent = find_product_by_sku(group.parent_sku)

  if parent does not exist:
    parent = create_variable_product(group)
  else:
    update_variable_product(parent.id, group)

  existing_variations = list_variations(parent.id)

  for each article in group.articles:
    variation = find_variation_by_sku(existing_variations, article.sku)

    if variation exists:
      update_variation(parent.id, variation.id, article)
    else:
      create_variation(parent.id, article)

  for each existing_variation not present in ERP group:
    set variation stock_status to outofstock or status to draft
```

## Important decisions

- Use variable products for differences like length, size, diameter, color, material, or packaging.
- Keep products separate when the customer would compare them as different products instead of choosing an option.
- Use one or two variation attributes when possible. Too many dropdowns make the product page harder to use.
- Keep ERP article SKU on the variation, not the parent product.
- Keep category assignment on the parent product.
- Keep product cards in category grids pointed at the parent product.

## Current theme behavior

The shop grid queries normal WooCommerce products. Product variations are not shown as separate cards by default, which is good for this setup. After ERP products are imported as variable products, category pages should show the parent product once, while the product page contains the selectable variations.
