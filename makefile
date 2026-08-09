include docker-images.env
include scripts/makeFiles/docker.mk
include scripts/makeFiles/tests.mk
export

.PHONY: install prek-install dev watch docker-up docker-up-entra docker-down build pda-spec api-generate knip lint lint-fix integration integration-watch e2e e2e-ui test-all coverage unit unit-watch db-applications db-scoping-questions run-tests

# 	op run --env-file=.env uses 1Password to load environment variables securely
# 	you can --no-masking flag means that varaibles is not masked in the output which can be used for debugging

install:
	yarn install

prek-install:
	yarn prek:install

dev:
	yarn dev

watch:
	yarn dev:watch

docker-up:
	yarn dev:docker

# Sign in via real Entra ID instead of the default mock-oauth2-server - see docker-compose.entra.yml.
docker-up-entra:
	yarn dev:docker:entra

docker-down:
	docker compose down

build:
	yarn build

pda-spec:
	yarn api:pda

api-generate:
	yarn api:generate

knip:
	yarn knip

lint: knip
	yarn lint

lint-fix: knip
	yarn lint:fix

integration-watch:
	yarn integration:watch

e2e-ui:
	yarn e2e:ui

test: 
	yarn test

coverage:
	yarn unit:coverage

unit-watch:
	yarn unit:watch
