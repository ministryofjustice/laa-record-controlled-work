MOCHA := ./node_modules/.bin/mocha
PLAYWRIGHT := yarn playwright test --config=tests/playwright/playwright.config.ts

.PHONY: unit integration e2e run-tests

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
	@$(MAKE) run-tests directory=tests/integration file=$(file) runner=$(MOCHA)
else
	yarn integration
endif

# Run e2e tests.
#
# Usage:
#   make e2e                                          - run all e2e tests
#   make e2e file=create-application                  - run a specific test by filename (with or without .spec.ts)
#   make e2e file=journeys/create-application         - When multiple files share the same name

e2e:
ifdef file
	@$(MAKE) run-tests directory=tests/playwright file=$(file) "runner=$(PLAYWRIGHT)"
else
	yarn e2e
endif
