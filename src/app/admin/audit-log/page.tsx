import { promises as fs } from "fs";
import path from "path";

export default async function AuditLogPage() {
  let logContent = "";

  try {
    const filePath = path.join(process.cwd(), "public", "bias_audit_log.txt");
    logContent = await fs.readFile(filePath, "utf-8");
  } catch {
    logContent = `[ERROR] Could not load bias_audit_log.txt
[INFO] Please ensure the file exists in the /public directory.`;
  }

  const lines = logContent.split("\n");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Nhật ký Audit Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhật ký hệ thống hiển thị việc tự động loại bỏ các từ khóa mang tính thiên kiến khỏi mô tả công việc.
        </p>
      </div>

      {/* Terminal-like UI */}
      <div className="rounded-xl border border-border overflow-hidden shadow-lg">
        {/* Terminal header */}
        <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2.5 border-b border-zinc-700">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-3 text-xs text-zinc-400 font-mono">
            focali-bias-filter.log
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-zinc-950 p-5 overflow-x-auto max-h-[60vh] overflow-y-auto">
          <pre className="font-mono text-sm leading-relaxed">
            {lines.map((line, i) => {
              let color = "#FFD700"; // Default gold
              if (line.includes("[REMOVED]") || line.includes("[FILTERED]")) {
                color = "#EF4444"; // Red for removals
              } else if (line.includes("[PASS]") || line.includes("[CLEAN]")) {
                color = "#22C55E"; // Green for clean
              } else if (line.includes("[INFO]")) {
                color = "#60A5FA"; // Blue for info
              } else if (line.includes("[WARN]")) {
                color = "#FBBF24"; // Amber for warnings
              } else if (line.startsWith("---") || line.startsWith("===")) {
                color = "#6B7280"; // Gray for separators
              }

              return (
                <div key={i} className="flex">
                  <span className="select-none text-zinc-600 mr-4 w-6 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span style={{ color }}>{line}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
