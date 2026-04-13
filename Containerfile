FROM oven/bun:1

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Install Playwright browser dependencies and Chromium
RUN bunx playwright install --with-deps chromium

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "start"]
