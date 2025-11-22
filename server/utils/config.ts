import fs from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "pathe";
import { customAlphabet } from "nanoid";

export type AppConfig = {
	dataDir: string;
	dbPath: string;
	chunkSize: number;
	sessionTtlMs: number;
	kmsBaseUrl: string;
	kmsClientToken: string;
	kmsRequestTimeoutMs: number;
	registrationSeed: string;
	mailFrom: string;
	mailGmailUser: string;
	mailGmailAppPassword: string;
};

const tokenAlphabet =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const createToken = customAlphabet(tokenAlphabet, 40);

let cached: AppConfig | null = null;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SESSION_DAYS = 14;
const DEFAULT_CHUNK_SIZE = 10485760;
const MAX_CHUNK_ALLOWED = 10485760;

function ensureWritableDirectory(path: string) {
	fs.mkdirSync(path, { recursive: true });
	fs.accessSync(path, fs.constants.W_OK);
}

function resolveDataDir(): string {
	const defaultDir = resolve(process.cwd(), "server/.data");
	const tempDir = resolve(tmpdir(), "vault-data");
	const configuredDir = process.env.STORAGE_DATA_DIR
		? resolve(process.env.STORAGE_DATA_DIR)
		: null;
	let lastError: unknown;

	if (configuredDir) {
		try {
			ensureWritableDirectory(configuredDir);
			return configuredDir;
		} catch (error) {
			lastError = error;
			console.warn(
				`[config] Unable to use STORAGE_DATA_DIR=${configuredDir}, falling back to ${defaultDir}`,
				error
			);
		}
	}

	try {
		ensureWritableDirectory(defaultDir);
		return defaultDir;
	} catch (error) {
		lastError = error;
		console.warn(
			`[config] Unable to use default storage directory ${defaultDir}, attempting ${tempDir}`,
			error
		);
	}

	try {
		ensureWritableDirectory(tempDir);
		console.warn(
			`[config] Using temporary storage directory ${tempDir}; data will not persist between restarts.`
		);
		return tempDir;
	} catch (error) {
		lastError = error;
	}

	const message =
		lastError instanceof Error ? lastError.message : "unknown error";
	throw new Error(
		`[config] Unable to find a writable storage directory. Last error: ${message}`
	);
}

export function getAppConfig(): AppConfig {
	if (cached) return cached;

	const dataDir = resolveDataDir();

	const chunkSizeEnv = Number(process.env.STORAGE_CHUNK_SIZE);
	const chunkSize =
		Number.isFinite(chunkSizeEnv) && chunkSizeEnv > 1024
			? Math.min(chunkSizeEnv, MAX_CHUNK_ALLOWED)
			: DEFAULT_CHUNK_SIZE;

	const sessionDaysEnv = Number(process.env.STORAGE_SESSION_TTL_DAYS);
	const sessionDays =
		Number.isFinite(sessionDaysEnv) && sessionDaysEnv > 0
			? sessionDaysEnv
			: DEFAULT_SESSION_DAYS;

	const requestTimeoutEnv = Number(process.env.KMS_REQUEST_TIMEOUT_MS);
	const kmsRequestTimeoutMs =
		Number.isFinite(requestTimeoutEnv) && requestTimeoutEnv >= 1000
			? requestTimeoutEnv
			: 10000;
	const registrationSeed = process.env.REGISTRATION_SEED || "";
	const mailFrom = process.env.MAIL_FROM || "no-reply@vault.local";
	const mailGmailUser = process.env.MAIL_GMAIL_USER || "";
	const mailGmailAppPassword = process.env.MAIL_GMAIL_APP_PASSWORD || "";

	cached = {
		dataDir,
		dbPath: resolve(dataDir, "vault.db"),
		chunkSize,
		sessionTtlMs: sessionDays * DAY_MS,
		kmsBaseUrl: process.env.KMS_BASE_URL || "http://localhost:3000",
		kmsClientToken: process.env.KMS_CLIENT_TOKEN || createToken(),
		kmsRequestTimeoutMs,
		registrationSeed,
		mailFrom,
		mailGmailUser,
		mailGmailAppPassword,
	};

	return cached;
}
