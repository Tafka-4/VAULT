#!/usr/bin/env node
import crypto from "node:crypto";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

const CHANGE_TIME_MS = 60 * 30 * 1000; // keep in sync with server/utils/verificationCode.ts

function mix(base1, base2) {
	const mixed = Buffer.alloc(Math.max(base1.length, base2.length));
	for (let i = 0; i < mixed.length; i++) {
		mixed[i] = base1[i % base1.length] ^ base2[i % base2.length];
	}
	return mixed;
}

function parseEnvFile(filepath) {
	if (!fs.existsSync(filepath)) return {};
	const content = fs.readFileSync(filepath, "utf-8");
	return content
		.split("\n")
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

function getRegistrationSeed() {
	if (process.env.REGISTRATION_SEED) {
		return process.env.REGISTRATION_SEED;
	}

	const envPath = path.resolve(process.cwd(), ".env");
	const envValues = parseEnvFile(envPath);
	if (envValues.REGISTRATION_SEED) {
		return envValues.REGISTRATION_SEED;
	}

	throw new Error(
		"REGISTRATION_SEED must be set in the environment or .env file."
	);
}

function deriveCompanionSecret(seed) {
	return crypto
		.createHash("sha256")
		.update(`${seed}:companion`)
		.digest("hex");
}

function computeCode(offsetWindows = 0) {
	const seed = getRegistrationSeed();
	const primarySecret = Buffer.from(seed);
	const companionSecret = Buffer.from(deriveCompanionSecret(seed));
	const now = Date.now() + offsetWindows * CHANGE_TIME_MS;
	const timeWindow = Math.floor(now / CHANGE_TIME_MS);
	const timeSalt = crypto
		.createHash("sha256")
		.update(timeWindow.toString())
		.digest("hex");
	const mixedSecret = mix(primarySecret, companionSecret);
	const finalKey = crypto
		.createHash("sha256")
		.update(`${mixedSecret.toString("hex")}:${timeSalt}`)
		.digest("hex");
	return `Vault{${finalKey}}`;
}

try {
	console.log(computeCode(0));
} catch (error) {
	console.error("Failed to compute verification code:", error.message);
	process.exit(1);
}
