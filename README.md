This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


//Write up section

When first reviewing the assignment, the description is rather vague and open ended. I wasn't sure exactly what I should be building. The "A list view is fine, map is not required." description made me think I would just need to call the same apis as the website provided and recreate the table they had. I've decided to create a more unique product which I will discuss more about.

I decided to create an app which allows a user to type in an address and then a table will list a bunch of different food carts ordered by distance from the provided address. I've decided to use NextJS to leverage the server side rendering capabilities or more specifically the getStaticProps function. Server side rendering allows us to offload more of the computation heavy lifting to the backend instead of the client's browser which allows for speed optimization. We first call an api to fetch the count of all food trucks in SF. We then use that to fetch a list of all food trucks. We then do some filtering on the data, so we eliminate any food truck that isn't currently open on the day or the specific time range. We then pass the filtered list of food trucks to the actual page itself. The reason we use getStaticProps is because we want to only run the server function during build time. This is because the data does not change that much which allows us to cache the api fetches in a cdn if we were actually hosting and running this app. We do however re-run getStaticProps every hour just to update the list of open food carts since the carts open/close times change by incremints of 1 hr. Caching is also beneficial for us because the amount of data that we are fetching could be quite large since we are technically fetching all the food carts data before filtering. We don't want to have to do this on each page load for each user. The reason why we need to fetch all the data is because we eventually need to sort it all and display the closest ones to the user. 

The actual page itself contains an input and submit button. The user types in an address and we pass the address to an api call from positionstack. I would have used google api for more accurate results, but this was just the easiest and quickest to set up. The api call converts the provided address into lat and long coordinates. I then sort the list of food carts (which is in our props) by their distance to the provided address. If an error occurs, I just display invalid input and don't display any table. Otherwise a table is displayed with the sorted results. The table displays the name, location, description, and close and start times. For the table we use react-table and styled components just because they are the most light weight options (I think). Table allows for pagination and we can display more rows on the table if we like to through a drop down.

