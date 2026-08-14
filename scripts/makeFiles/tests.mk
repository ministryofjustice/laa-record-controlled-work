MOCHA := ./node_modules/.bin/mocha
PLAYWRIGHT := yarn playwright test --config=tests/ui/playwright.config.ts

.PHONY: unit integration ui run-tests

# Run tests from a specified directory and optional file.
#
# Internal helper target - use via `unit`, `integration`, or `e2e` targets.
#
# Parameters:
#   directory - path to tests directory (e.g., tests/unit)
#   file      - optional test file name or path (with or without .spec.ts)
#   runner    - test runner command (e.g., $(MOCHA) or $(PLAYWRIGHT))
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
	$(runner) "$$MATCHES"
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
	@$(MAKE) run-tests directory=tests/unit file=$(file) runner=$(MOCHA)
else
	yarn test:unit
endif

# Run integration tests.
#
# Usage:
#   make integration                 - run all integration tests
#   make integration file=auth       - run a specific test by filename (with or without .spec.ts)
#   make integration file=journeys/create-application - When multiple files share the same name

integration:
ifdef file
	@$(MAKE) run-tests directory=tests/integration file=$(file) runner=$(MOCHA)
else
	yarn test:integration
endif

# Run UI tests (single-service browser tests with MSW mocks).
#
# Usage:
#   make ui                                           - run all UI tests
#   make ui file=create-application                   - run a specific test by filename (with or without .spec.ts)
#   make ui file=journeys/create-application          - When multiple files share the same name

ui:
ifdef file
	@$(MAKE) run-tests directory=tests/ui file=$(file) "runner=$(PLAYWRIGHT)"
else
	yarn test:ui
endif
