#!/usr/bin/env bash
# run.sh - build, start and stop the backend.
#   backend/run.sh build            package the jar (runs unit tests)
#   backend/run.sh start [--fresh]  start on :8080; --fresh uses a new empty database
#   backend/run.sh stop
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PID="$DIR/target/backend.pid"; LOG="$DIR/target/backend.log"; JAR="$DIR/target/quickflow-backend.jar"

# Needs JDK 21+; fall back to a local install when JAVA_HOME points at an older one.
java_ok() { "$1" -version 2>&1 | grep -qE 'version "(2[1-9]|[3-9][0-9])'; }
if ! java_ok "${JAVA_HOME:+$JAVA_HOME/bin/}java"; then
  for j in "$HOME/Documents/env/jdk/21" /usr/lib/jvm/java-21-openjdk-amd64; do
    java_ok "$j/bin/java" 2>/dev/null && { export JAVA_HOME="$j"; break; }
  done
fi
[[ -n "${JAVA_HOME:-}" ]] && export PATH="$JAVA_HOME/bin:$PATH"

stop() { [[ -f "$PID" ]] && kill "$(cat "$PID")" 2>/dev/null && sleep 2; rm -f "$PID"; }

case "${1:-}" in
  build) (cd "$DIR" && mvn -q -B package) ;;
  stop) stop ;;
  start)
    stop
    [[ -f "$JAR" ]] || (cd "$DIR" && mvn -q -B package -DskipTests)
    DB="jdbc:h2:file:$DIR/data/quickflow"
    [[ "${2:-}" == "--fresh" ]] && DB="jdbc:h2:mem:fresh;DB_CLOSE_DELAY=-1"
    DB_URL="$DB" nohup java -jar "$JAR" > "$LOG" 2>&1 & echo $! > "$PID"
    for _ in $(seq 60); do
      curl -sf localhost:8080/actuator/health >/dev/null && { echo "backend up on http://localhost:8080"; exit 0; }
      sleep 1
    done
    echo "backend failed to start, see $LOG"; tail -20 "$LOG"; exit 1 ;;
  *) sed -n '2,5p' "$0"; exit 64 ;;
esac
