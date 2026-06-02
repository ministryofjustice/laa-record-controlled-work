include docker-images.env
export

MOCHA    := ./node_modules/.bin/mocha
TEST_DIR := tests/unit

# Mirrors .mocharc.json options (excluding spec) which allows single file runs in local without impacting CICD
MOCHA_OPTS := --no-config \
	--require tests/unit/setup.ts \
	--node-option no-warnings \
	--node-option import=tsx \
	--extension ts \
	--extension tsx \
	--reporter list


.PHONY: dev watch docker-up docker-down build lint e2e e2e-ui test-all unit

# 	op run --env-file=.env uses 1Password to load environment variables securely
# 	you can --no-masking flag means that varaibles is not masked in the output which can be used for debugging

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

lint: 
	yarn lint

e2e:
	yarn e2e

e2e-ui:
	yarn e2e-ui

test-all: unit e2e lint


# Run unit tests.
#
# Usage:
#   make unit                        - run all unit tests
#   make unit file=either            - run a specific test by filename (with or without .spec.ts)
#   make unit file=services/auth     - When multiple files share the same name

unit:
ifdef file
	@MATCHES=$$(find $(TEST_DIR) \( -path "*/$(file)" -o -path "*/$(file).spec.ts" \) 2>/dev/null); \
	if [ -z "$$MATCHES" ]; then \
		echo "Error: No test file found matching '$(file)' in $(TEST_DIR)/"; \
		exit 1; \
	fi; \
	COUNT=$$(echo "$$MATCHES" | wc -l | tr -d ' '); \
	if [ "$$COUNT" -gt 1 ]; then \
		echo "Error: Multiple files found for '$(file)', be more specific by including parent directory"; \
		echo "$$MATCHES"; \
		exit 1; \
	fi; \
	$(MOCHA) $(MOCHA_OPTS) "$$MATCHES"
else
	$(MOCHA) --recursive '$(TEST_DIR)/**/*.spec.ts'
endif