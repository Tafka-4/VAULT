#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";

const argv = parseArgs(process.argv.slice(2));
const envFile = loadEnvFile();

const config = buildConfig();

if (config.insecure) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	console.warn("[upload-test] TLS verification disabled (--insecure)");
}

if (!config.email || !config.password) {
	console.error(
		"Missing credentials. Provide --email/--password or set UPLOAD_TEST_EMAIL/UPLOAD_TEST_PASSWORD."
	);
	process.exit(1);
}

async function main() {
	const client = new ApiClient(config.host);
	console.log(`Logging in as ${config.email} @ ${config.host}`);
	await client.login(config.email, config.password);

	const totalChunks = Math.ceil(config.totalBytes / config.chunkBytes);
	console.log(
		`Creating upload session for ${formatBytes(
			config.totalBytes
		)} (${totalChunks} chunks @ ${formatBytes(config.chunkBytes)} max)`
	);
	const sessionId = await client.createUploadSession({
		name: config.filename,
		mimeType: config.mimeType,
		size: config.totalBytes,
		totalChunks,
		folderId: config.folderId,
	});

	const workerCount = Math.min(config.concurrency, totalChunks);
	console.log(
		`Uploading chunks with concurrency=${workerCount} and chunk size ${formatBytes(
			config.chunkBytes
		)}`
	);
	const uploadStarted = performance.now();
	const chunkStats = await uploadChunks({
		client,
		sessionId,
		totalChunks,
		totalBytes: config.totalBytes,
		chunkBytes: config.chunkBytes,
		workerCount,
	});
	const uploadDuration = performance.now() - uploadStarted;

	console.log("Finalizing session...");
	await client.finalizeSession(sessionId);

	const avgRate = config.totalBytes / (uploadDuration / 1000);
	console.log("--- Upload Summary ---");
	console.log(`File: ${config.filename}`);
	console.log(
		`Payload: ${formatBytes(config.totalBytes)} across ${totalChunks} chunks in ${formatDuration(
			uploadDuration
		)} (avg ${formatRate(avgRate)})`
	);
	const slowest = [...chunkStats].sort((a, b) => b.durationMs - a.durationMs)[0];
	if (slowest) {
		console.log(
			`Slowest chunk: #${slowest.index} ${formatBytes(
				slowest.size
			)} in ${formatDuration(slowest.durationMs)} (${formatRate(
				slowest.rateBytesPerSec
			)})`
		);
	}
}

function buildConfig() {
	const host = getOption("host", "UPLOAD_TEST_HOST", "http://localhost:3000");
	const email = getOption("email", "UPLOAD_TEST_EMAIL");
	const password = getOption("password", "UPLOAD_TEST_PASSWORD");
	const sizeMb = parseNumber(
		getOption("size", "UPLOAD_TEST_SIZE_MB", "20"),
		"size"
	);
	const chunkMb = parseNumber(
		getOption("chunk", "UPLOAD_TEST_CHUNK_MB", "10"),
		"chunk"
	);
	const concurrency = Math.max(
		1,
		Math.floor(
			parseNumber(
				getOption("concurrency", "UPLOAD_TEST_CONCURRENCY", "4"),
				"concurrency"
			)
		)
	);
	const filename =
		getOption("name", "UPLOAD_TEST_FILENAME") ||
		`upload-test-${Date.now()}.bin`;
	const mimeType = getOption("mime", "UPLOAD_TEST_MIME", "application/octet-stream");
	const folder = getOption("folder", "UPLOAD_TEST_FOLDER_ID", "root");
	const folderId = folder && folder.toLowerCase() !== "root" ? folder : null;
	const totalBytes = Math.max(Math.floor(sizeMb * 1024 * 1024), 1);
	const chunkBytes = Math.max(Math.floor(chunkMb * 1024 * 1024), 1024);
	return {
		host: host.replace(/\/$/, ""),
		email,
		password,
		totalBytes,
		chunkBytes,
		concurrency,
		filename,
		mimeType,
		folderId,
		insecure: parseBoolean(getOption("insecure", "UPLOAD_TEST_INSECURE", "false")),
	};
}

async function uploadChunks({
	client,
	sessionId,
	totalChunks,
	totalBytes,
	chunkBytes,
	workerCount,
}) {
	const stats = [];
	let nextIndex = 0;
	const worker = async () => {
		while (true) {
			const index = nextIndex++;
			if (index >= totalChunks) break;
			const size = Math.min(
				chunkBytes,
				totalBytes - index * chunkBytes
			);
			const buffer = Buffer.alloc(size, 0);
			const started = performance.now();
			await client.sendChunk(sessionId, index, buffer);
			const durationMs = performance.now() - started;
			const rateBytesPerSec = size / (durationMs / 1000);
			stats[index] = { index, size, durationMs, rateBytesPerSec };
			console.log(
				`[chunk ${index}] ${formatBytes(size)} in ${formatDuration(
					durationMs
				)} (${formatRate(rateBytesPerSec)})`
			);
		}
	};
	await Promise.all(Array.from({ length: workerCount }, worker));
	return stats.filter(Boolean);
}

class ApiClient {
	constructor(baseUrl) {
		this.baseUrl = baseUrl;
		this.cookies = new Map();
	}

	async login(email, password) {
		await this.request("/api/auth/login", {
			method: "POST",
			json: { email, password },
		});
	}

	async createUploadSession({ name, mimeType, size, totalChunks, folderId }) {
		const response = await this.request("/api/uploads/init", {
			method: "POST",
			json: { name, mimeType, size, totalChunks, folderId },
		});
		const id = response?.data?.uploadId;
		if (!id) {
			throw new Error("Upload session ID missing from response");
		}
		return id;
	}

	async sendChunk(sessionId, index, buffer) {
		await this.request(`/api/uploads/${sessionId}/chunk?index=${index}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Length": String(buffer.length),
			},
			body: buffer,
		});
	}

	async finalizeSession(sessionId) {
		await this.request(`/api/uploads/${sessionId}/complete`, {
			method: "POST",
		});
	}

	async request(path, { method = "GET", headers = {}, body, json } = {}) {
		const url = new URL(path, this.baseUrl);
		const headerBag = new Headers(headers);
		if (this.cookies.size) {
			headerBag.set("cookie", this.serializeCookies());
		}
		let payload = body;
		if (json !== undefined) {
			headerBag.set("content-type", "application/json");
			payload = JSON.stringify(json);
		}
	let response;
	try {
		response = await fetch(url, {
			method,
			headers: headerBag,
			body: payload,
		});
	} catch (error) {
		throw createError(`Request ${method} ${url.pathname} failed`, error);
	}
	this.captureCookies(response);
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw createError(
			`Request ${method} ${url.pathname} failed (${response.status} ${response.statusText}): ${text}`
		);
	}
	const text = await response.text();
	return text ? JSON.parse(text) : {};
}

	serializeCookies() {
		return Array.from(this.cookies.entries())
			.map(([key, value]) => `${key}=${value}`)
			.join("; ");
	}

	captureCookies(response) {
		const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
		const cookieValues = getSetCookie
			? getSetCookie()
			: response.headers.get("set-cookie")
			? [response.headers.get("set-cookie")]
			: [];
		for (const raw of cookieValues) {
			if (!raw) continue;
			const [pair] = raw.split(";");
			if (!pair) continue;
			const idx = pair.indexOf("=");
			if (idx === -1) continue;
			const name = pair.slice(0, idx).trim();
			const value = pair.slice(idx + 1).trim();
			if (name) {
				this.cookies.set(name, value);
			}
		}
	}
}

function parseArgs(args) {
	const result = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg.startsWith("--")) continue;
		const key = arg.slice(2);
		const next = args[i + 1];
		if (next && !next.startsWith("--")) {
			result[key] = next;
			i += 1;
		} else {
			result[key] = "true";
		}
	}
	return result;
}

function getOption(cliKey, envKey, fallback) {
	if (cliKey in argv) {
		return argv[cliKey];
	}
	if (envKey) {
		const envValue = getEnv(envKey);
		if (envValue !== undefined) {
			return envValue;
		}
	}
	return fallback;
}

function getEnv(key) {
	if (process.env[key] !== undefined) return process.env[key];
	if (envFile[key] !== undefined) return envFile[key];
	return undefined;
}

function parseNumber(value, label) {
	const num = Number(value);
	if (!Number.isFinite(num) || num <= 0) {
		throw new Error(`Invalid ${label} value: ${value}`);
	}
	return num;
}

function parseBoolean(value) {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (!normalized) return false;
		return ["1", "true", "yes", "on"].includes(normalized);
	}
	return false;
}

function loadEnvFile() {
	const envPath = path.resolve(process.cwd(), ".env");
	if (!fs.existsSync(envPath)) {
		return {};
	}
	const content = fs.readFileSync(envPath, "utf8");
	return content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
		.reduce((acc, line) => {
			const idx = line.indexOf("=");
			if (idx === -1) return acc;
			const key = line.slice(0, idx).trim();
			const value = line
				.slice(idx + 1)
				.trim()
				.replace(/^['"]|['"]$/g, "");
			acc[key] = value;
			return acc;
		}, {});
}

function formatBytes(bytes) {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	const digits = unit === 0 ? 0 : 2;
	return `${value.toFixed(digits)} ${units[unit]}`;
}

function formatRate(bytesPerSecond) {
	return `${formatBytes(bytesPerSecond)}/s`;
}

function formatDuration(ms) {
	if (ms < 1000) {
		return `${ms.toFixed(1)} ms`;
	}
	return `${(ms / 1000).toFixed(2)} s`;
}

function createError(message, cause) {
	if (cause) {
		return new Error(message, { cause });
	}
	return new Error(message);
}

function formatError(error) {
	if (error instanceof Error) {
		const lines = [`Upload test failed: ${error.message}`];
		const causes = collectCauses(error);
		for (const [index, cause] of causes.entries()) {
			const label = index === 0 ? "cause" : `cause ${index}`;
			lines.push(`  ${label}: ${cause}`);
		}
		return lines.join("\n");
	}
	return `Upload test failed: ${String(error)}`;
}

function collectCauses(error) {
	const results = [];
	const seen = new Set();
	let current = error;
	while (current instanceof Error && current.cause && !seen.has(current.cause)) {
		seen.add(current.cause);
		const cause = current.cause;
		if (cause instanceof Error) {
			results.push(describeCause(cause));
			current = cause;
			continue;
		}
		if (cause && typeof cause === "object") {
			const code = cause.code || cause.errno;
			const message = cause.message || JSON.stringify(cause);
			results.push([code, message].filter(Boolean).join(" - ") || String(cause));
			break;
		}
		results.push(String(cause));
		break;
	}
	return results;
}

function describeCause(error) {
	const parts = [];
	if ("code" in error && error.code) {
		parts.push(error.code);
	}
	if ("errno" in error && error.errno && error.errno !== error.code) {
		parts.push(`errno=${error.errno}`);
	}
	if (error.message) {
		parts.push(error.message);
	} else if (error.stack) {
		parts.push(error.stack.split("\n")[0]);
	}
	return parts.filter(Boolean).join(" | ") || error.toString();
}

main().catch((error) => {
	console.error(formatError(error));
	process.exit(1);
});
