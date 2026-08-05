include docker-images.env
export

MOCHA    := ./node_modules/.bin/mocha

.PHONY: install prek-install dev watch docker-up docker-down build pda-spec api-generate knip lint lint-fix integration integration-watch e2e e2e-ui test-all coverage unit unit-watch

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

# Run tests from a specified directory and optional file.
#
# Internal helper target - use via `unit` or `integration` targets.
#
# Parameters:
#   directory - path to tests directory (e.g., tests/unit)
#   file      - optional test file name or path (with or without .spec.ts)
run-tests:
ifdef file
	@MATCHES=$$(find $(directory) \( -path "*/$(file)" -o -path "*/$(file).spec.ts" \) 2>/dev/null); \
	if [ -z "$$MATCHES" ]; then \
		echo "Error: No test file found matching '$(file)' in $(directory)/"; \
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
	$(error file parameter required)
endif

# Run unit tests.
#
# Usage:
#   make unit                        - run all unit tests
#   make unit file=either            - run a specific test by filename (with or without .spec.ts)
#   make unit file=services/auth     - When multiple files share the same name

unit:
ifdef file
	@$(MAKE) run-tests directory=tests/unit file=$(file)
else
	yarn unit
endif

# Run integration tests.
#
# Usage:
#   make integration                 - run all integration tests
#   make integration file=auth       - run a specific test by filename (with or without .spec.ts)
#   make integration file=journeys/create-application - When multiple files share the same name

integration:
ifdef file
	@$(MAKE) run-tests directory=tests/integration file=$(file)
else
	yarn integration
endif