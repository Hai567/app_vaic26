const PLACEHOLDER_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

export function getSupabaseEnv() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey || anonKey === PLACEHOLDER_KEY) {
		throw new Error(
			"Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your project values before using sign up or login.",
		);
	}

	return { url, anonKey };
}