# AeroFlex Pro Local Product Assets

The script `scripts/add-detailed-chair-product.ts` reads local assets from this backend static folder.

Use these preferred filenames when you replace the mock files:

```text
public/assets/seed/models/aeroflex-pro.glb
public/assets/seed/products/aeroflex-pro-1.jpg
public/assets/seed/products/aeroflex-pro-2.jpg
public/assets/seed/products/aeroflex-pro-3.jpg
```

Mock files already included:

```text
public/assets/seed/models/aeroflex-pro.gltf
public/assets/seed/products/aeroflex-pro-1.svg
public/assets/seed/products/aeroflex-pro-2.svg
public/assets/seed/products/aeroflex-pro-3.svg
```

Accepted image extensions:

```text
.jpg
.jpeg
.png
.webp
.svg
```

Accepted model extensions:

```text
.glb
.gltf
```

Fallback behavior:

- Model falls back to `public/assets/seed/models/chair.gltf` if `aeroflex-pro.glb` / `aeroflex-pro.gltf` does not exist.
- Images fall back to existing seed placeholders if the `aeroflex-pro-*` images do not exist.

After replacing files, run:

```bash
npm run db:add-chair
```
