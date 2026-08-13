DB_CONTAINER := laa-info-and-advice-datastore
DB_USER := laa_user
DB_NAME := laa_info_advice_datastore
PSQL := docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -A -c

.PHONY: db-applications db-scoping-questions

db-applications:
	$(PSQL) "SELECT a.id, a.case_id, a.application_state, c.first_name, c.surname, c.ni_number FROM applications a JOIN client_details c ON c.id = a.client_details_id ORDER BY a.created_at DESC LIMIT 5;"

db-scoping-questions:
	$(PSQL) "SELECT id, case_id, scoping_questions FROM applications ORDER BY created_at DESC LIMIT 5;"
