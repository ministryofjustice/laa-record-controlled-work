.PHONY: watch dev docker-build docker-run unit

# 	op run --env-file=.env uses 1Password to load environment variables securely
# 	you can --no-masking flag means that varaibles is not masked in the output which can be used for debugging

watch: 
	op run --env-file=.env -- yarn build && yarn dev

dev: 
	op run --env-file=.env -- npx tsx src/app.ts

unit:
	yarn test:unit

docker-build:
	docker build -t laa-record-controlled-work:latest .

docker-run:
	op inject -i .env -o .env.resolved && \
	docker run -d -p 8888:3000 --env-file=.env.resolved laa-record-controlled-work:latest && \
	rm .env.resolved  
