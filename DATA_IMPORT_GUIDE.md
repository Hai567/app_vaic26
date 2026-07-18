# Hướng dẫn Import Dữ liệu — daFalcon

Tài liệu này hướng dẫn cách import dữ liệu nghề nghiệp, ngành học, trường đại học, và điểm chuẩn vào hệ thống daFalcon.

## Cấu trúc Database

```
careers (Nghề nghiệp)
  ├── id (UUID, auto)
  ├── title (varchar)
  ├── description (text)
  └── riasec_vector (vector[6]) → [R, I, A, S, E, C] (0.0 - 1.0)

majors (Ngành học)
  ├── id (UUID, auto)
  ├── name (varchar)
  └── career_id (FK → careers.id)

universities (Trường)
  ├── id (UUID, auto)
  ├── name (varchar)
  ├── region (varchar) → "Hà Nội", "TP.HCM", "Đà Nẵng"...
  └── tier (varchar) → "university" | "academy" | "vocational"

admission_scores (Điểm chuẩn)
  ├── id (UUID, auto)
  ├── major_id (FK → majors.id)
  ├── university_id (FK → universities.id)
  ├── subject_block (varchar) → "A00", "A01", "B00", "D01"...
  ├── year (integer)
  └── score (real)
```

## Phương pháp 1: Import từ CSV (Khuyến nghị)

### Bước 1: Chuẩn bị file CSV

**careers.csv**
```csv
title,description,riasec_r,riasec_i,riasec_a,riasec_s,riasec_e,riasec_c
Kỹ sư Phần mềm,Thiết kế và phát triển phần mềm,0.3,0.9,0.4,0.3,0.3,0.7
```

**universities.csv**
```csv
name,region,tier
Đại học Bách Khoa Hà Nội,Hà Nội,university
Cao đẳng FPT Polytechnic,Hà Nội,vocational
```

**majors.csv**
```csv
name,career_title
Công nghệ Thông tin,Kỹ sư Phần mềm
```

**admission_scores.csv**
```csv
major_name,university_name,subject_block,year,score
Công nghệ Thông tin,Đại học Bách Khoa Hà Nội,A00,2024,27.42
```

### Bước 2: Tạo script import

Tạo file `src/db/import-csv.ts`:

```typescript
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { careers, majors, universities, admissionScores } from "./schema";

async function importData() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // Enable pgvector
  await client`CREATE EXTENSION IF NOT EXISTS vector`;

  // Parse CSV (simple parser — use 'csv-parse' for production)
  function parseCSV(path: string): Record<string, string>[] {
    const content = readFileSync(path, "utf-8");
    const [headerLine, ...rows] = content.trim().split("\n");
    const headers = headerLine.split(",");
    return rows.map((row) => {
      const values = row.split(",");
      return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]));
    });
  }

  // 1. Import careers
  const careerRows = parseCSV("data/careers.csv");
  const insertedCareers = await db.insert(careers).values(
    careerRows.map((r) => ({
      title: r.title,
      description: r.description,
      riasecVector: [
        parseFloat(r.riasec_r),
        parseFloat(r.riasec_i),
        parseFloat(r.riasec_a),
        parseFloat(r.riasec_s),
        parseFloat(r.riasec_e),
        parseFloat(r.riasec_c),
      ],
    }))
  ).returning({ id: careers.id, title: careers.title });

  const careerMap = Object.fromEntries(insertedCareers.map((c) => [c.title, c.id]));

  // 2. Import universities
  const uniRows = parseCSV("data/universities.csv");
  const insertedUnis = await db.insert(universities).values(
    uniRows.map((r) => ({
      name: r.name,
      region: r.region,
      tier: r.tier,
    }))
  ).returning({ id: universities.id, name: universities.name });

  const uniMap = Object.fromEntries(insertedUnis.map((u) => [u.name, u.id]));

  // 3. Import majors
  const majorRows = parseCSV("data/majors.csv");
  const insertedMajors = await db.insert(majors).values(
    majorRows.map((r) => ({
      name: r.name,
      careerId: careerMap[r.career_title],
    }))
  ).returning({ id: majors.id, name: majors.name });

  const majorMap = Object.fromEntries(insertedMajors.map((m) => [m.name, m.id]));

  // 4. Import admission scores
  const scoreRows = parseCSV("data/admission_scores.csv");
  await db.insert(admissionScores).values(
    scoreRows.map((r) => ({
      majorId: majorMap[r.major_name],
      universityId: uniMap[r.university_name],
      subjectBlock: r.subject_block,
      year: parseInt(r.year),
      score: parseFloat(r.score),
    }))
  );

  console.log("Import complete!");
  await client.end();
}

importData().catch(console.error);
```

### Bước 3: Chạy import

```bash
cd app
npx tsx src/db/import-csv.ts
```

## Phương pháp 2: Import trực tiếp qua Supabase SQL Editor

Vào Supabase Dashboard → SQL Editor, chạy:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Insert career
INSERT INTO careers (title, description, riasec_vector) VALUES
  ('Kỹ sư Phần mềm', 'Thiết kế phần mềm', '[0.3,0.9,0.4,0.3,0.3,0.7]');

-- Insert university
INSERT INTO universities (name, region, tier) VALUES
  ('Đại học Bách Khoa Hà Nội', 'Hà Nội', 'university');

-- Insert major (cần career_id từ bước trên)
INSERT INTO majors (name, career_id) VALUES
  ('Công nghệ Thông tin', '<career-uuid>');

-- Insert admission score (cần major_id và university_id)
INSERT INTO admission_scores (major_id, university_id, subject_block, year, score) VALUES
  ('<major-uuid>', '<university-uuid>', 'A00', 2024, 27.42);
```

## Phương pháp 3: Dùng Drizzle Studio

```bash
cd app
npx drizzle-kit studio
```

Mở browser tại `https://local.drizzle.studio` để thêm/sửa data bằng giao diện trực quan.

## Lưu ý quan trọng

### RIASEC Vector
- Mỗi career cần vector 6 chiều: `[R, I, A, S, E, C]`
- Giá trị từ 0.0 đến 1.0
- R = Realistic, I = Investigative, A = Artistic, S = Social, E = Enterprising, C = Conventional

### Khối thi phổ biến
| Khối | Tổ hợp môn |
|------|-----------|
| A00 | Toán, Lý, Hóa |
| A01 | Toán, Lý, Anh |
| B00 | Toán, Hóa, Sinh |
| D01 | Toán, Văn, Anh |
| H00 | Toán, Vẽ, Văn |
| V00 | Toán, Lý, Vẽ |

### Xóa dữ liệu cũ trước khi import mới

```sql
TRUNCATE admission_scores CASCADE;
TRUNCATE majors CASCADE;
TRUNCATE universities CASCADE;
TRUNCATE careers CASCADE;
```

### Kiểm tra pgvector hoạt động

```sql
-- Test cosine similarity query
SELECT title, 1 - (riasec_vector <=> '[0.5,0.5,0.5,0.5,0.5,0.5]') as similarity
FROM careers
ORDER BY riasec_vector <=> '[0.5,0.5,0.5,0.5,0.5,0.5]'
LIMIT 5;
```
