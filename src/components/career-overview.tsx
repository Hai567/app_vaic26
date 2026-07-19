import { Info, DollarSign, Layers, Briefcase } from "lucide-react";
import type { CareerResult } from "@/store/chat-store";

export function CareerOverview({ career }: { career: CareerResult }) {
  if (!career.overview && !career.salaryInfo && (!career.subSectors || career.subSectors.length === 0) && (!career.futureCareers || career.futureCareers.length === 0)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Overview */}
      {career.overview && (
        <div className="col-span-1 md:col-span-2 rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Info size={16} />
            Giới thiệu chung
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{career.overview}</p>
        </div>
      )}

      {/* Future Careers */}
      {career.futureCareers && career.futureCareers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-500 font-medium text-sm">
            <Briefcase size={16} />
            Nghề nghiệp tương lai
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {career.futureCareers.map((c, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Sub Sectors */}
        {career.subSectors && career.subSectors.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 h-full">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-medium text-sm">
              <Layers size={16} />
              Các chuyên ngành nhỏ
            </div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
              {career.subSectors.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Salary Info */}
        {career.salaryInfo && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 h-full">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium text-sm">
              <DollarSign size={16} />
              Mức lương tham khảo
            </div>
            <p className="text-sm text-muted-foreground mt-2">{career.salaryInfo}</p>
            <p className="text-[10px] text-muted-foreground/60 italic mt-2 border-t border-border/50 pt-2">
              * Mức lương mang tính chất tham khảo tùy thuộc vào năng lực và nhu cầu thị trường.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
