.PHONY: watch dev docker-build docker-run

# 	op run --env-file=.env uses 1Password to load environment variables securely
# 	you can --no-masking flag means that varaibles is not masked in the output which can be used for debugging

watch: 
	yarn build && yarn dev

dev: 
	npx tsx src/app.ts

docker-build:
	docker build -t laa-record-controlled-work:latest .

docker-run:
	docker run -d -p 8888:3000 laa-record-controlled-work:latest

