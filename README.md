# Mai Roo — food-order-frontend

Angular 22 client for the Mai Roo food-ordering app. Backend: [FoodService](https://github.com/JohnBooce963/FoodService).

- `/` menu: pick a size, adjust quantities in the cart, place an order with your name
- `/orders` shop screen: latest orders, refreshes every 10 s, mark orders done

## Run locally

```bash
npm install
npm start    # http://localhost:4200
```

Start the backend first (`./mvnw spring-boot:run` in FoodService). The API URL is the `API` constant in
`src/app/api.ts` (defaults to `http://localhost:8080`); change it when you deploy.
