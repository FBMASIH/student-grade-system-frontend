import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	darkMode: "class",
	theme: {
		screens: {
			xs: "360px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1536px",
		},
		container: {
			center: true,
			padding: {
				DEFAULT: "1rem",
				sm: "2rem",
				lg: "4rem",
				xl: "5rem",
				"2xl": "6rem",
			},
		},
		extend: {
			colors: {
				// Main brand colors
				brand: {
					50: "#eef2ff",
					100: "#e0e7ff",
					200: "#c7d2fe",
					300: "#a5b4fc",
					400: "#818cf8",
					500: "#6366f1", // Primary brand color
					600: "#4f46e5",
					700: "#4338ca",
					800: "#3730a3",
					900: "#312e81",
				},
				// UI Colors
				surface: {
					DEFAULT: "rgb(var(--surface) / <alpha-value>)",
					muted: "rgb(var(--surface-muted) / <alpha-value>)",
					emphasis: "rgb(var(--surface-emphasis) / <alpha-value>)",
				},
				// Semantic colors
				success: {
					50: "#f0fdf4",
					100: "#dcfce7",
					200: "#bbf7d0",
					300: "#86efac",
					400: "#4ade80",
					500: "#22c55e",
					600: "#16a34a",
					700: "#15803d",
				},
				warning: {
					50: "#fffbeb",
					100: "#fef3c7",
					200: "#fde68a",
					300: "#fcd34d",
					400: "#fbbf24",
					500: "#f59e0b",
					600: "#d97706",
					700: "#b45309",
				},
				error: {
					50: "#fef2f2",
					100: "#fee2e2",
					200: "#fecaca",
					300: "#fca5a5",
					400: "#f87171",
					500: "#ef4444",
					600: "#dc2626",
					700: "#b91c1c",
				},
				// Neutral colors for text and backgrounds
				neutral: {
					50: "#fafafa",
					100: "#f4f4f5",
					200: "#e4e4e7",
					300: "#d4d4d8",
					400: "#a1a1aa",
					500: "#71717a",
					600: "#52525b",
					700: "#3f3f46",
					800: "#27272a",
					900: "#18181b",
				},
			},
			fontFamily: {
				iranyekan: ["var(--font-iranyekan)"],
				sans: ["var(--font-yekan)", "sans-serif"],
				persian: ["var(--font-iranyekan)", "Vazir", "sans-serif"],
				vazir: ["var(--font-iranyekan)", "Vazirmatn", "sans-serif"],
				vazirmatn: ["var(--font-vazirmatn)"],
				yekan: ["var(--font-yekan)"], // or 'var(--font-estedad)' for Estedad
				estedad: ["var(--font-estedad)"],
			},
			spacing: {
				"4xs": "0.125rem", // 2px
				"3xs": "0.25rem", // 4px
				"2xs": "0.375rem", // 6px
				xs: "0.5rem", // 8px
				sm: "0.75rem", // 12px
				md: "1rem", // 16px
				lg: "1.25rem", // 20px
				xl: "1.5rem", // 24px
				"2xl": "2rem", // 32px
				"3xl": "2.5rem", // 40px
				"4xl": "3rem", // 48px
				"5xl": "4rem", // 64px
				"6xl": "5rem", // 80px
				"7xl": "6rem", // 96px
			},
			borderRadius: {
				"4xs": "0.125rem", // 2px
				"3xs": "0.25rem", // 4px
				"2xs": "0.375rem", // 6px
				xs: "0.5rem", // 8px
				sm: "0.75rem", // 12px
				md: "1rem", // 16px
				lg: "1.25rem", // 20px
				xl: "1.5rem", // 24px
				"2xl": "2rem", // 32px
				"3xl": "3rem", // 48px
			},
			animation: {
				"fade-in": "fadeIn 0.3s ease-in-out",
				"slide-up": "slideUp 0.4s ease-out",
				"fade-up": "fadeUp 0.5s ease-out",
				"smooth-bounce": "smooth-bounce 1s infinite",
				float: "float 3s ease-in-out infinite",
			},
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				slideUp: {
					"0%": { transform: "translateY(20px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				fadeUp: {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"smooth-bounce": {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-5px)" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-10px)" },
				},
			},
			boxShadow: {
				"soft-xl": "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
				"soft-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
				subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
				base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
				medium:
					"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
				large:
					"0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
				xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
				"inner-light": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
				"inner-medium": "inset 0 4px 6px -1px rgb(0 0 0 / 0.1)",
			},
			zIndex: {
				behind: "-1",
				default: "1",
				dropdown: "1000",
				sticky: "1020",
				fixed: "1030",
				"modal-backdrop": "1040",
				modal: "1050",
				popover: "1060",
				tooltip: "1070",
			},
			maxWidth: {
				prose: "65ch",
				"screen-xs": "360px",
				"screen-sm": "640px",
				"screen-md": "768px",
				"screen-lg": "1024px",
				"screen-xl": "1280px",
				"screen-2xl": "1536px",
			},
		},
	},
	plugins: [
		nextui({
			themes: {
				light: {
					colors: {
						background: "#ffffff",
						foreground: "#18181b",
						primary: {
							50: "#eef2ff",
							100: "#e0e7ff",
							200: "#c7d2fe",
							300: "#a5b4fc",
							400: "#818cf8",
							500: "#6366f1",
							600: "#4f46e5",
							700: "#4338ca",
							800: "#3730a3",
							900: "#312e81",
							DEFAULT: "#6366f1",
							foreground: "#ffffff",
						},
						focus: "#6366f1",
					},
					layout: {
						disabledOpacity: 0.5,
						dividerWeight: "1px",
						fontSize: {
							tiny: "0.75rem",
							small: "0.875rem",
							medium: "1rem",
							large: "1.125rem",
						},
						lineHeight: {
							tiny: "1rem",
							small: "1.25rem",
							medium: "1.5rem",
							large: "1.75rem",
						},
						radius: {
							small: "0.375rem",
							medium: "0.5rem",
							large: "0.75rem",
						},
					},
				},
				dark: {
					colors: {
						background: "#18181b",
						foreground: "#fafafa",
						primary: {
							50: "#eef2ff",
							100: "#e0e7ff",
							200: "#c7d2fe",
							300: "#a5b4fc",
							400: "#818cf8",
							500: "#6366f1",
							600: "#4f46e5",
							700: "#4338ca",
							800: "#3730a3",
							900: "#312e81",
							DEFAULT: "#818cf8",
							foreground: "#18181b",
						},
						focus: "#818cf8",
					},
					layout: {
						disabledOpacity: 0.5,
						dividerWeight: "1px",
						fontSize: {
							tiny: "0.75rem",
							small: "0.875rem",
							medium: "1rem",
							large: "1.125rem",
						},
						lineHeight: {
							tiny: "1rem",
							small: "1.25rem",
							medium: "1.5rem",
							large: "1.75rem",
						},
						radius: {
							small: "0.375rem",
							medium: "0.5rem",
							large: "0.75rem",
						},
					},
				},
			},
		}),
	],
};

export default config;
