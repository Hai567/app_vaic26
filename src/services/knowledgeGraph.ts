/**
 * In-memory knowledge graph service.
 * Loads knowledge_graph.json once at startup and provides query helpers
 * for career matching, subject combos, universities, and salary data.
 */
import graphData from "@/data/knowledge_graph.json";

interface GraphNode {
	label: string;
	id: string;
	description?: string;
	salary?: string;
	type?: string;
	location?: string;
}

interface GraphEdge {
	relation: string;
	source: string;
	target: string;
	key: number;
}

const nodes: GraphNode[] = graphData.nodes as GraphNode[];
const edges: GraphEdge[] = graphData.edges as GraphEdge[];

// Pre-index for fast lookups
const nodeById = new Map<string, GraphNode>();
for (const n of nodes) nodeById.set(n.id, n);

const edgesBySource = new Map<string, GraphEdge[]>();
const edgesByTarget = new Map<string, GraphEdge[]>();
for (const e of edges) {
	if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
	edgesBySource.get(e.source)!.push(e);
	if (!edgesByTarget.has(e.target)) edgesByTarget.set(e.target, []);
	edgesByTarget.get(e.target)!.push(e);
}

/** All career groups (Nhóm Ngành) */
export function getAllCareerGroups() {
	return nodes
		.filter((n) => n.label === "Nhóm Ngành")
		.map((n) => ({
			id: n.id,
			description: n.description || "",
			salary: n.salary || "",
		}));
}

/** Get RIASEC codes for a career group */
export function getRiasecForCareer(careerId: string): string[] {
	return (edgesBySource.get(careerId) || [])
		.filter((e) => e.relation === "PHÙ_HỢP_RIASEC")
		.map((e) => e.target);
}

/** Get MBTI codes for a career group */
export function getMbtiForCareer(careerId: string): string[] {
	return (edgesBySource.get(careerId) || [])
		.filter((e) => e.relation === "PHÙ_HỢP_MBTI")
		.map((e) => e.target);
}

/** Get sub-majors (Ngành Hẹp) for a career group */
export function getSubMajorsForCareer(careerId: string): string[] {
	return (edgesBySource.get(careerId) || [])
		.filter((e) => e.relation === "BAO_GỒM_NGÀNH_HẸP")
		.map((e) => e.target);
}

/** Get subject combos (Tổ Hợp Xét Tuyển) for a career group */
export function getSubjectCombosForCareer(careerId: string): string[] {
	return (edgesBySource.get(careerId) || [])
		.filter((e) => e.relation === "CÓ_TỔ_HỢP_XÉT_TUYỂN")
		.map((e) => e.target);
}

/** Get universities that train a specific sub-major */
export function getUniversitiesForMajor(majorName: string): GraphNode[] {
	return (edgesByTarget.get(majorName) || [])
		.filter((e) => e.relation === "ĐÀO_TẠO")
		.map((e) => nodeById.get(e.source))
		.filter((n): n is GraphNode => !!n && n.label === "Cơ Sở Đào Tạo");
}

/** Find career groups matching a set of RIASEC codes */
export function findCareersByRiasec(userCodes: string[]): { id: string; matchCount: number; description: string; salary: string }[] {
	const careers = getAllCareerGroups();
	const results = careers.map((c) => {
		const careerCodes = getRiasecForCareer(c.id);
		const matchCount = userCodes.filter((code) => careerCodes.includes(code)).length;
		return { ...c, matchCount };
	});
	return results.filter((r) => r.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);
}

/** Find career groups matching MBTI type */
export function findCareersByMbti(mbtiType: string): { id: string; description: string; salary: string }[] {
	const careers = getAllCareerGroups();
	return careers.filter((c) => getMbtiForCareer(c.id).includes(mbtiType));
}

/** Build a comprehensive context string for a career group (for LLM injection) */
export function buildCareerContext(careerId: string): string {
	const node = nodeById.get(careerId);
	if (!node || node.label !== "Nhóm Ngành") return "";

	const riasec = getRiasecForCareer(careerId);
	const mbti = getMbtiForCareer(careerId);
	const subMajors = getSubMajorsForCareer(careerId);
	const combos = getSubjectCombosForCareer(careerId);

	const uniMap = new Map<string, string[]>();
	for (const major of subMajors) {
		const unis = getUniversitiesForMajor(major);
		for (const uni of unis) {
			if (!uniMap.has(uni.id)) uniMap.set(uni.id, []);
			uniMap.get(uni.id)!.push(major);
		}
	}

	let ctx = `### ${careerId}\n`;
	ctx += `Mô tả: ${node.description || "N/A"}\n`;
	ctx += `Mức lương: ${node.salary || "N/A"}\n`;
	ctx += `RIASEC: ${riasec.join(", ")}\n`;
	ctx += `MBTI phù hợp: ${mbti.join(", ")}\n`;
	ctx += `Ngành hẹp: ${subMajors.join("; ")}\n`;
	ctx += `Tổ hợp xét tuyển: ${combos.join("; ")}\n`;

	if (uniMap.size > 0) {
		ctx += `Trường đào tạo:\n`;
		for (const [uniId, majors] of uniMap) {
			const uniNode = nodeById.get(uniId);
			const location = uniNode?.location || "";
			ctx += `  - ${uniId}${location ? ` (${location})` : ""}: ${majors.join(", ")}\n`;
		}
	}

	return ctx;
}

/** Build a full knowledge context for the top N matching careers */
export function buildKnowledgeContext(
	userRiasec: string[] | null,
	userMbti: string | null,
	limit = 5
): string {
	let matchedCareers: { id: string; description: string; salary: string; matchCount?: number }[] = [];

	if (userRiasec && userRiasec.length > 0) {
		matchedCareers = findCareersByRiasec(userRiasec).slice(0, limit);
	}

	// Add MBTI matches that aren't already included
	if (userMbti) {
		const mbtiMatches = findCareersByMbti(userMbti);
		for (const m of mbtiMatches) {
			if (!matchedCareers.find((c) => c.id === m.id)) {
				matchedCareers.push(m);
			}
		}
	}

	// If no matches at all, return all careers as general knowledge
	if (matchedCareers.length === 0) {
		matchedCareers = getAllCareerGroups().slice(0, limit);
	}

	const sections = matchedCareers.map((c) => buildCareerContext(c.id));
	return `[KNOWLEDGE GRAPH — DỮ LIỆU NGÀNH NGHỀ / TRƯỜNG / TỔ HỢP]\n${sections.join("\n")}`;
}
