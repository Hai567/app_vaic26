import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { userRoadmap, users, careers, universities, majors } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
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
			return NextResponse.json({ data: [] });
		}
		const [dbUser] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.authId, user.id))
			.limit(1);

		if (!dbUser) {
			return NextResponse.json({ data: [] });
		}

		const roadmap = await db
			.select({
				id: userRoadmap.id,
				status: userRoadmap.status,
				createdAt: userRoadmap.createdAt,
				careerTitle: careers.title,
				universityName: universities.name,
				majorName: majors.name,
			})
			.from(userRoadmap)
			.where(eq(userRoadmap.userId, dbUser.id))
			.innerJoin(careers, eq(userRoadmap.careerId, careers.id))
			.leftJoin(
				universities,
				eq(userRoadmap.universityId, universities.id),
			)
			.leftJoin(majors, eq(userRoadmap.majorId, majors.id));

		return NextResponse.json({ data: roadmap });
	} catch (error) {
		console.error("GET /api/roadmap error", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		if (!db) {
			return NextResponse.json(
				{ error: "Database not available" },
				{ status: 503 },
			);
		}
		const body = await request.json();
		const { careerId, universityId, majorId, status } = body;

		if (!careerId) {
			return NextResponse.json(
				{ error: "careerId is required" },
				{ status: 400 },
			);
		}

		const [dbUser] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.authId, user.id))
			.limit(1);

		if (!dbUser) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);
		}

		// Prevent Foreign Key Constraint violation for fallback careers
		if (careerId.startsWith("fallback-")) {
			const [existingCareer] = await db
				.select()
				.from(careers)
				.where(eq(careers.id, careerId))
				.limit(1);

			if (!existingCareer) {
				await db.insert(careers).values({
					id: careerId,
					title: body.careerTitle || "Gợi ý AI",
					description: "Nghề nghiệp được tạo tự động bởi AI",
					riasecVector: body.careerVector || [5, 5, 5, 5, 5, 5],
				});
			}
		}

		// Check if already exists
		const existing = await db
			.select()
			.from(userRoadmap)
			.where(
				and(
					eq(userRoadmap.userId, dbUser.id),
					eq(userRoadmap.careerId, careerId),
					universityId
						? eq(userRoadmap.universityId, universityId)
						: undefined,
				),
			)
			.limit(1);

		if (existing.length > 0) {
			return NextResponse.json(
				{ message: "Already in roadmap" },
				{ status: 200 },
			);
		}

		const [inserted] = await db
			.insert(userRoadmap)
			.values({
				userId: dbUser.id,
				careerId,
				universityId,
				majorId,
				status: status || "considering",
			})
			.returning();

		return NextResponse.json({ data: inserted }, { status: 201 });
	} catch (error) {
		console.error("POST /api/roadmap error", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		if (!db) {
			return NextResponse.json(
				{ error: "Database not available" },
				{ status: 503 },
			);
		}
		const body = await request.json();
		const { careerId } = body;

		if (!careerId) {
			return NextResponse.json(
				{ error: "careerId is required" },
				{ status: 400 },
			);
		}

		const [dbUser] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.authId, user.id))
			.limit(1);

		if (!dbUser) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);
		}

		await db
			.delete(userRoadmap)
			.where(
				and(
					eq(userRoadmap.userId, dbUser.id),
					eq(userRoadmap.careerId, careerId)
				)
			);

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("DELETE /api/roadmap error", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
