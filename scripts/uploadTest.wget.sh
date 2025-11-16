#!/bin/sh
# Minimal upload test that only depends on POSIX sh, wget, sed, and dd.
# Configure via environment variables before running:
#   HOST=https://vault.example.com \\
#   EMAIL=user@example.com \\
#   PASSWORD=secret \\
#   SIZE_MB=40 CHUNK_MB=8 ./scripts/uploadTest.wget.sh

set -eu

HOST=${HOST:-http://localhost:3000}
EMAIL=${EMAIL:-}
PASSWORD=${PASSWORD:-}
SIZE_MB=${SIZE_MB:-40}
CHUNK_MB=${CHUNK_MB:-8}
NAME=${NAME:-upload-test-$(date +%s)}
MIME=${MIME:-application/octet-stream}
FOLDER=${FOLDER:-}

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
	printf 'ERROR: EMAIL and PASSWORD must be provided as environment variables.\n' >&2
	exit 1
fi

MB=1048576
SIZE_BYTES=$((SIZE_MB * MB))
CHUNK_BYTES=$((CHUNK_MB * MB))

if [ "$CHUNK_BYTES" -le 0 ] || [ "$SIZE_BYTES" -le 0 ]; then
	printf 'ERROR: SIZE_MB and CHUNK_MB must be positive integers.\n' >&2
	exit 1
fi

TOTAL_CHUNKS=$(((SIZE_BYTES + CHUNK_BYTES - 1) / CHUNK_BYTES))

FOLDER_FIELD=null
if [ -n "$FOLDER" ] && [ "$FOLDER" != "root" ]; then
	FOLDER_FIELD='"'"$(printf '%s' "$FOLDER" | sed 's/\\/\\\\/g; s/"/\\"/g')"'"'
fi

json_escape() {
	printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

LOGIN_PAYLOAD='{"email":"'"$(json_escape "$EMAIL")"'","password":"'"$(json_escape "$PASSWORD")"'"}'
INIT_PAYLOAD='{"name":"'"$(json_escape "$NAME")"'","mimeType":"'"$(json_escape "$MIME")"'","size":'"$SIZE_BYTES"',"totalChunks":'"$TOTAL_CHUNKS"',"folderId":'"$FOLDER_FIELD"'}'

TMPDIR=$(mktemp -d 2>/dev/null || mktemp -d -t upload-test)
COOKIE_JAR="$TMPDIR/cookies.txt"
trap 'rm -rf "$TMPDIR"' EXIT INT TERM

log() {
	printf '%s\n' "$*"
}

wget_json() {
	URL=$1
	OUTPUT=$2
	shift 2
	wget --quiet "$URL" -O "$OUTPUT" "$@"
}

log "[upload-test] Logging in to $HOST"
wget --quiet \
	--save-cookies "$COOKIE_JAR" \
	--keep-session-cookies \
	--header='Content-Type: application/json' \
	--post-data "$LOGIN_PAYLOAD" \
	-O "$TMPDIR/login.json" \
	"$HOST/api/auth/login"

log "[upload-test] Creating upload session for $TOTAL_CHUNKS chunk(s)"
wget --quiet \
	--load-cookies "$COOKIE_JAR" \
	--save-cookies "$COOKIE_JAR" \
	--keep-session-cookies \
	--header='Content-Type: application/json' \
	--post-data "$INIT_PAYLOAD" \
	-O "$TMPDIR/init.json" \
	"$HOST/api/uploads/init"

UPLOAD_ID=$(sed -n 's/.*"uploadId":"\([^"[:space:]]*\)".*/\1/p' "$TMPDIR/init.json" | head -n 1)
if [ -z "$UPLOAD_ID" ]; then
	printf 'ERROR: Unable to parse uploadId from init response.\n' >&2
	cat "$TMPDIR/init.json" >&2
	exit 1
fi
log "[upload-test] Session ID: $UPLOAD_ID"

overall_start=$(date +%s)
chunk_index=0
bytes_sent=0

while [ "$chunk_index" -lt "$TOTAL_CHUNKS" ]; do
	remaining=$((SIZE_BYTES - bytes_sent))
	size=$CHUNK_BYTES
	if [ "$size" -gt "$remaining" ]; then
		size=$remaining
	fi
	chunk_file="$TMPDIR/chunk.bin"
	dd if=/dev/zero of="$chunk_file" bs="$size" count=1 >/dev/null 2>&1
	start_chunk=$(date +%s)
	wget --quiet \
		--load-cookies "$COOKIE_JAR" \
		--keep-session-cookies \
		--header='Content-Type: application/octet-stream' \
		--post-file="$chunk_file" \
		-O "$TMPDIR/chunk-$chunk_index.json" \
		"$HOST/api/uploads/$UPLOAD_ID/chunk?index=$chunk_index"
	end_chunk=$(date +%s)
	duration=$((end_chunk - start_chunk))
	if [ "$duration" -le 0 ]; then
		duration=1
	fi
	rate=$((size / duration))
	log "[chunk $chunk_index] $size bytes in ${duration}s (~$rate B/s)"
	chunk_index=$((chunk_index + 1))
	bytes_sent=$((bytes_sent + size))
done

log "[upload-test] Finalizing session"
wget --quiet \
	--load-cookies "$COOKIE_JAR" \
	--keep-session-cookies \
	--header='Content-Type: application/json' \
	--post-data '{}' \
	-O "$TMPDIR/finalize.json" \
	"$HOST/api/uploads/$UPLOAD_ID/complete"

overall_end=$(date +%s)
total_duration=$((overall_end - overall_start))
if [ "$total_duration" -le 0 ]; then
	total_duration=1
fi
avg_rate=$((SIZE_BYTES / total_duration))
log "[upload-test] Completed $SIZE_BYTES bytes in ${total_duration}s (~$avg_rate B/s)"
