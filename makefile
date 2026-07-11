include docker-images.env
export

MOCHA    := ./node_modules/.bin/mocha
TEST_DIR := tests/unit
INTEGRATION_DIR := tests/integration


.PHONY: install prek-install dev watch docker-up docker-down build api-generate lint lint-fix integration integration-watch e2e e2e-ui test-all coverage unit unit-watch

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

docker-down:
	docker compose down

build:
	yarn build

api-generate:
	yarn api:generate

lint: 
	yarn lint

lint-fix: 
	yarn lint:fix

integration:
	yarn integration

integration-watch:
	yarn integration:watch

e2e:
	yarn e2e

e2e-ui:
	yarn e2e:ui

test: 
	yarn test

coverage:
	yarn unit:coverage

unit-watch:
	yarn unit:watch

# Run unit tests.
#
# Usage:
#   make unit                        - run all unit tests
#   make unit file=either            - run a specific test by filename (with or without .spec.ts)
#   make unit file=services/auth     - When multiple files share the same name

unit: 
ifdef file
	@MATCHES=$$(find tests/unit \( -path "*/$(file)" -o -path "*/$(file).spec.ts" \) 2>/dev/null); \
	if [ -z "$$MATCHES" ]; then \
		echo "Error: No test file found matching '$(file)' in tests/unit/"; \
		exit 1; \
	fi; \
	COUNT=$$(echo "$$MATCHES" | wc -l | tr -d ' '); \
	if [ "$$COUNT" -gt 1 ]; then \
		echo "Error: Multiple files found for '$(file)', be more specific by including parent directory"; \
		echo "$$MATCHES"; \
		exit 1; \
	fi; \
	$(MOCHA) "$$MATCHES"
else
	yarn unit
endif