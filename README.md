This code is based on the OpenAI API  [quickstart tutorial](https://platform.openai.com/docs/quickstart) which uses [Next.js](https://nextjs.org/) framework with [React](https://reactjs.org/). We also make use of the [Chinese Poetry](https://github.com/chinese-poetry/chinese-poetry) github repo.

To Run The Website
1. Add your [API key](https://platform.openai.com/account/api-keys) to the `.env` file
2. Run the app with `npm run dev` You should be able to access the app at [http://localhost:3000](http://localhost:3000).

To build the database:
- Run `src/databaes/database-load.js`. This will build a local SQLite Database on disk (~100MB) and will take ~5 mins.

To query the database:
- `node src/database/database-query.js --query "SELECT * FROM poems LIMIT 1"`