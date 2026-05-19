# Seed Asset Sources

The database seed mixes local demo assets with online assets so the app can show realistic product cards without requiring every 3D model to be stored in this repository.

## Local Assets

Local images and glTF models live under:

```text
public/assets/seed
```

These are served by the backend at:

```text
/assets/seed
```

## Online Images

Seed image URLs use Unsplash CDN image URLs. The selected photos are free Unsplash photos and are used as visual demo imagery for furniture/interior product cards.

- Chris Zhang, furniture/lamp photo: https://unsplash.com/photos/a-chair-on-a-table-Dd72OS27SmI
- Jonathan Borba, living room interior photo: https://unsplash.com/photos/a-living-room-with-a-couch-a-chair-and-a-table-9iljaLpo9uw
- CHUTTERSNAP, furniture room photo: https://unsplash.com/photos/a-living-room-filled-with-blue-chairs-and-tables-QAvYXR6nL8Y
- Alex Tyson, living room/rug photo: https://unsplash.com/photos/a-living-room-filled-with-furniture-and-a-rug-IA3OFG9VZVM
- Puscas Adryan, bedroom/furniture photo: https://unsplash.com/photos/modern-bedroom-with-a-large-bed-and-shelves-AQDjMlr5Cu8

Unsplash license: https://unsplash.com/license

## Online 3D Models

The seed only enables AR/model support when a product has either a local model or a close online model. Generic online models are not assigned to unrelated products.

- three.js SheenChair: https://threejs.org/examples/models/gltf/SheenChair.glb
- three.js AnisotropyBarnLamp: https://threejs.org/examples/models/gltf/AnisotropyBarnLamp.glb

For more furniture-specific CC0 models to download locally later, Poly Haven is a good source:

- Poly Haven license: https://polyhaven.com/license
- Coffee Table 01 model: https://polyhaven.com/a/CoffeeTable_01
- Wooden Table 01 model: https://polyhaven.com/a/WoodenTable_01
