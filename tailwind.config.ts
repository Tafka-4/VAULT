import type { Config } from "tailwindcss";

export default {
	content: [
		"./app.vue",
		"./components/**/*.{vue,js,ts}",
		"./layouts/**/*.vue",
		"./pages/**/*.vue",
		"./plugins/**/*.{js,ts}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					'"Plus Jakarta Sans"',
					"ui-sans-serif",
					"system-ui",
					"Apple Color Emoji",
				],
			},
			colors: {
				ink: "oklch(14.1% 0.005 285.823)",
				paper: "oklch(86.9% 0.005 56.366)",
				inkFallback: "#09090b",
				paperFallback: "#d6d3d1",
			},
			boxShadow: {
				vault: "0 0 0 1px oklch(86.9% 0.005 56.366 / 0.08), 0 6px 32px -8px oklch(86.9% 0.005 56.366 / 0.18)",
			},
			borderRadius: {
				vault: "1.25rem",
			},
		},
	},
	plugins: [],
} satisfies Config;
