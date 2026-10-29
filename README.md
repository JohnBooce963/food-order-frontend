# Mai Roo — food-order-frontend

Angular 22 client for the Mai Roo food-ordering app. Backend: [FoodService](https://github.com/JohnBooce963/FoodService).

- `/` landing page: popular dishes, categories, "surprise me" pick
- `/menu` menu by category with search, cart, place an order with your name (`/menu?cat=แกง` opens a category)
- `/login` shop login (the backend's `SHOP_PASSWORD`)
- `/orders` shop screen, login required: pending/done tabs, today's totals, refreshes every 10 s

Dishes without an image show `public/no-image.svg`.

## Run locally

```bash
npm install
npm start    # http://localhost:4200
```

Start the backend first (`./mvnw spring-boot:run` in FoodService). On `localhost` the app talks to
`http://localhost:8080`; anywhere else it uses the Railway backend (the `API` constant in `src/app/api.ts`).

## Deploy (Vercel)

`npx vercel --prod` from this folder, or import the repo in Vercel; the Angular preset works as-is.
`vercel.json` sends deep links like `/orders` to `index.html`.
