#!/usr/bin/env bash
# BE-01 Foundation. Expects a fresh backend on :8080.
source loops/_lib/curl-lib.sh

req GET /actuator/health; expect_status 200 "health"; expect_jq '.status == "UP"' "status UP"
req GET /v3/api-docs;     expect_status 200 "OpenAPI document"; expect_jq '.info.title == "QuickFlow API"' "API title"
STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/swagger-ui/index.html"); expect_status 200 "Swagger UI"

req GET /api/settings; expect_status 200 "get settings"
expect_jq '.displayName == "QuickFlow user" and .timezone == "UTC" and .defaultView == "DASHBOARD" and .notificationsEnabled' "defaults"

req PUT /api/settings '{"displayName":" Omar ","email":"omar@example.com","timezone":"Asia/Dubai","notificationsEnabled":false,"defaultView":"PLANS"}'
expect_status 200 "update settings"; expect_jq '.displayName == "Omar" and .timezone == "Asia/Dubai" and .defaultView == "PLANS"' "saved and trimmed"
req GET /api/settings; expect_jq '.email == "omar@example.com" and .notificationsEnabled == false' "persisted"

req PUT /api/settings '{"displayName":"","timezone":"UTC","notificationsEnabled":true,"defaultView":"TASKS"}'
expect_status 400 "blank name"; expect_jq '.errors[0].field == "displayName"' "field error displayName"
req PUT /api/settings '{"displayName":"x","timezone":"Mars/Base","notificationsEnabled":true,"defaultView":"TASKS"}'
expect_status 400 "unknown timezone"; expect_jq '.errors[0].field == "timezone"' "field error timezone"
req PUT /api/settings '{"displayName":"x","email":"nope","timezone":"UTC","notificationsEnabled":true,"defaultView":"TASKS"}'
expect_status 400 "bad email"; expect_jq '.errors[0].field == "email"' "field error email"
req PUT /api/settings '{"displayName":"x","timezone":"UTC","notificationsEnabled":true,"defaultView":"CALENDAR"}'
expect_status 400 "invalid enum"; expect_jq '.errors[0].field == "defaultView" and (.detail | contains("allowed values"))' "allowed values listed"
req PUT /api/settings '{"displayName": '; expect_status 400 "malformed JSON"

req GET /api/nope; expect_status 404 "unknown route"; expect_jq '.status == 404' "problem body"
CT=$(curl -s -o /dev/null -w '%{content_type}' "$BASE/api/nope"); [[ $CT == application/problem+json* ]] && _ok "problem+json content type" || _bad "problem+json content type" "$CT"
req DELETE /api/settings; expect_status 405 "method not allowed"

H=$(curl -s -D - -o /dev/null -X OPTIONS "$BASE/api/settings" -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: PUT')
grep -qi 'access-control-allow-origin: http://localhost:5173' <<<"$H" && _ok "CORS allows frontend" || _bad "CORS allows frontend" "no header"
H=$(curl -s -D - -o /dev/null -X OPTIONS "$BASE/api/settings" -H 'Origin: http://evil.example' -H 'Access-Control-Request-Method: PUT')
grep -qi 'access-control-allow-origin' <<<"$H" && _bad "CORS blocks others" "header present" || _ok "CORS blocks others"

summary
