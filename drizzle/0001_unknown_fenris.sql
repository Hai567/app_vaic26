CREATE TABLE "user_roadmap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"career_id" varchar(255) NOT NULL,
	"university_id" uuid,
	"major_id" uuid,
	"status" varchar(50) DEFAULT 'considering',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_roadmap" ADD CONSTRAINT "user_roadmap_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roadmap" ADD CONSTRAINT "user_roadmap_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roadmap" ADD CONSTRAINT "user_roadmap_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roadmap" ADD CONSTRAINT "user_roadmap_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE no action ON UPDATE no action;