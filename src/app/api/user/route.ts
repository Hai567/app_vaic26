import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/** GET: Fetch user's modalData, aiExtractedData, preferencesLog */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		if (!db) {
			return NextResponse.json({
				modalData: null,
				aiExtractedData: null,
				preferencesLog: [],
			});
		}

		const [dbUser] = await db
			.select()
			.from(users)
			.where(eq(users.authId, user.id))
			.limit(1);

		if (!dbUser) {
			// Create user record on first fetch
			const [newUser] = await db
				.insert(users)
				.values({
					authId: user.id,
					email: user.email,
					displayName: user.user_metadata?.display_name || null,
				})
				.returning();

			return NextResponse.json({
				modalData: null,
				aiExtractedData: null,
				preferencesLog: [],
			});
		}

		return NextResponse.json({
			modalData: dbUser.modalData,
			aiExtractedData: dbUser.aiExtractedData,
			preferencesLog: dbUser.preferencesLog || [],
		});
	} catch (error) {
		console.error("User GET error:", error);
		return NextResponse.json({
			modalData: null,
			aiExtractedData: null,
			preferencesLog: [],
		});
	}
}

/** PUT: Update modalData or aiExtractedData */
export async function PUT(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const body = await request.json();

		if (!db) {
			return NextResponse.json({ ok: true });
		}

		const updateData: Record<string, unknown> = {};
		if (body.modalData !== undefined) updateData.modalData = body.modalData;
		if (body.aiExtractedData !== undefined)
			updateData.aiExtractedData = body.aiExtractedData;
		if (body.preferencesLog !== undefined)
			updateData.preferencesLog = body.preferencesLog;

		// Upsert: update if exists, create if not
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.authId, user.id))
			.limit(1);

		if (existing) {
			await db
				.update(users)
				.set(updateData)
				.where(eq(users.authId, user.id));
		} else {
			await db.insert(users).values({
				authId: user.id,
				email: user.email,
				displayName: user.user_metadata?.display_name || null,
				...updateData,
			});
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("User PUT error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
