.PHONY: watch dev unit e2e e2e-ui test lint docker-build docker-run

# 	op run --env-file=.env uses 1Password to load environment variables securely
# 	you can --no-masking flag means that varaibles is not masked in the output which can be used for debugging

watch: 
	op run --env-file=.env -- yarn build && yarn dev

dev: 
	op run --env-file=.env -- npx tsx src/server.ts

unit:
	./node_modules/.bin/mocha
	

e2e:
	yarn build && yarn test:e2e

e2e-ui:
	yarn build && yarn playwright test --ui --config=tests/playwright/playwright.config.ts

test: unit e2e lint

lint: 
	yarn lint

docker-build:
	docker build -t laa-record-controlled-work:latest .

docker-run:
	op inject -i .env -o .env.resolved && \
	docker run -d -p 8888:3000 --env-file=.env.resolved laa-record-controlled-work:latest && \
	rm .env.resolved  
