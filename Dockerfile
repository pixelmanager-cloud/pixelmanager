# fm-server (async-PvP backend). Node 22 for the built-in node:sqlite module used
# in local dev; production sets DATABASE_URL and uses Postgres instead.
FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm ci
ENV PORT=8787
EXPOSE 8787
CMD ["npm", "run", "start", "--workspace=server"]
