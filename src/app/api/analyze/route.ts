import { NextRequest } from "next/server";
import { fetchRepoTree, fetchRawFile } from "@/lib/github";
import { inMemoryVectorStoreAdapter } from "@/lib/vector_store_adapter";
import { claudeAdapter } from "@/lib/claude_adapter";
import { reserveUsage } from "@/lib/usageGuard";

export const runtime = "nodejs";

interface GitHubRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  private?: boolean;
}

const GITHUB_SLUG = /^[A-Za-z0-9._-]{1,100}$/;

function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== "github.com") return null;

    const rawPath = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
    const [owner, rawName] = rawPath.split("/");
    if (!owner || !rawName) return null;

    const name = rawName.endsWith(".git") ? rawName.slice(0, -4) : rawName;
    if (!GITHUB_SLUG.test(owner) || !GITHUB_SLUG.test(name)) return null;
    return { owner, name };
  } catch {
    return null;
  }
}

type StackSubject = "Frontend" | "Backend" | "Auth" | "Infra" | "DX";

function calculateRepoStats(
  entries: Array<{ path: string; type?: string; size?: number }>,
): {
  stackRadar: { subject: StackSubject; value: number }[];
  hotspots: { path: string; complexity: number }[];
} {
  const fileEntries = entries.filter((entry) => entry.type !== "tree");
  const subjectScores: Record<StackSubject, number> = {
    Frontend: 0,
    Backend: 0,
    Auth: 0,
    Infra: 0,
    DX: 0,
  };

  for (const entry of fileEntries) {
    const lowerPath = entry.path.toLowerCase();
    const ext = lowerPath.split(".").pop() ?? "";
    const matchedSubjects = new Set<StackSubject>();

    if (["ts", "tsx", "js", "jsx", "css", "scss", "sass", "less", "html", "mdx"].includes(ext)) {
      matchedSubjects.add("Frontend");
    }
    if (["ts", "js", "py", "go", "rb", "java", "cs", "rs", "php", "kt", "swift", "c", "cpp"].includes(ext)) {
      matchedSubjects.add("Backend");
    }
    if (
      lowerPath.includes("auth") ||
      lowerPath.includes("oauth") ||
      lowerPath.includes("session") ||
      lowerPath.includes("jwt")
    ) {
      matchedSubjects.add("Auth");
    }
    if (
      ["dockerfile", "docker", "yml", "yaml", "tf", "ini", "toml", "sh", "ps1", "sql"].includes(ext) ||
      lowerPath.includes("infra") ||
      lowerPath.includes("deploy") ||
      lowerPath.includes("ops") ||
      lowerPath.includes("k8s")
    ) {
      matchedSubjects.add("Infra");
    }
    if (["md", "mdx", "json", "lock", "config"].includes(ext) || lowerPath.includes("docs")) {
      matchedSubjects.add("DX");
    }

    if (matchedSubjects.size === 0) {
      matchedSubjects.add("DX");
    }

    const weight = 1 / matchedSubjects.size;
    matchedSubjects.forEach((subject) => {
      subjectScores[subject] += weight;
    });
  }

  const totalWeight = Math.max(1, fileEntries.length);
  const stackRadar = (["Frontend", "Backend", "Auth", "Infra", "DX"] as StackSubject[]).map(
    (subject) => ({
      subject,
      value: Math.min(100, Math.round((subjectScores[subject] / totalWeight) * 100)),
    }),
  );

  const sortedBySize = [...fileEntries].sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  const maxSize = sortedBySize.length > 0 ? Math.max(...sortedBySize.map((entry) => entry.size ?? 0)) : 0;
  const hotspots = sortedBySize.slice(0, 5).map((entry) => ({
    path: entry.path,
    complexity: maxSize > 0 ? Math.round(40 + (60 * (entry.size ?? 0)) / maxSize) : 50,
  }));

  return { stackRadar, hotspots };
}

async function buildElevatorPitch(
  repo: GitHubRepo,
  readme: string,
  fileTree: Array<{ path: string; type?: string }>,
  sampleCode?: string | null,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    const description = repo.description?.trim();
    const readmeLine = readme.split("\n").find((line) => line.trim().length > 0);
    const primaryLang = repo.language ? `Primary language: ${repo.language}.` : "";
    const repoStats = `Stars: ${repo.stargazers_count}, forks: ${repo.forks_count}.`;
    const lead = description || readmeLine || `Codebase for ${repo.full_name}.`;
    return [lead, primaryLang, repoStats].filter(Boolean).join(" ");
  }

  try {
    const fileTreeSummary = fileTree
      .slice(0, 30)
      .filter((f) => f.type !== "tree")
      .map((f) => f.path)
      .join(", ");

    const prompt = [
      "You are gitlore, an expert software explainer. Write a short elevator pitch for this repository that someone can take in at a glance.",
      "",
      "Use exactly this markdown structure and nothing else:",
      "",
      "One or two plain sentences (at most 35 words) saying what the project is and why it exists.",
      "",
      "- **What it does:** the main things a user can do with it",
      "- **How it works:** the core mechanism or flow",
      "- **Stack:** languages, frameworks and services, comma-separated",
      "- **Who it's for:** the intended user",
      "- **Notable:** the one design decision that sets it apart",
      "",
      "Each bullet is one sentence of at most 25 words. Be specific to this repository; skip generic praise. Put file names and identifiers in backticks.",
      "",
      "Repository information:",
      `- Name: ${repo.full_name}`,
      repo.description ? `- Description: ${repo.description}` : "",
      repo.language ? `- Primary language: ${repo.language}` : "",
      `- Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}`,
      "",
      fileTreeSummary ? `File structure (sample): ${fileTreeSummary}` : "",
      "",
      readme && readme !== "[no readme]" ? `README excerpt:\n${readme.slice(0, 1000)}` : "",
      "",
      sampleCode ? `Sample code:\n${sampleCode.slice(0, 1500)}` : "",
      "",
      "Return only the pitch in the structure above: no heading, no preamble, no closing remark.",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await claudeAdapter.chat({
      messages: [{ id: "pitch", role: "user", content: prompt, createdAt: new Date().toISOString() }],
      config: { streaming: false },
    });

    const cleanedText = completion.content.trim();
    const stats = [
      repo.language,
      `${repo.stargazers_count} stars`,
      `${repo.forks_count} forks`,
    ]
      .filter(Boolean)
      .join(" · ");

    // The stats go on their own line, in italics, so the UI can style them apart.
    return `${cleanedText}

_${stats}_`;
  } catch (error) {
    console.warn("Failed to generate AI elevator pitch, using fallback:", error);
    const description = repo.description?.trim();
    const readmeLine = readme.split("\n").find((line) => line.trim().length > 0);
    const primaryLang = repo.language ? `Primary language: ${repo.language}.` : "";
    const repoStats = `Stars: ${repo.stargazers_count}, forks: ${repo.forks_count}.`;
    const lead = description || readmeLine || `Codebase for ${repo.full_name}.`;
    return [lead, primaryLang, repoStats].filter(Boolean).join(" ");
  }
}

export async function POST(req: NextRequest) {
  try {
    
    const { repoUrl } = (await req.json()) as { repoUrl?: string };

    if (!repoUrl || typeof repoUrl !== "string" || repoUrl.length > 300) {
      return Response.json({ error: "Missing or invalid repoUrl" }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return Response.json({ error: "Only GitHub URLs are supported for now." }, { status: 400 });
    }

    const { owner, name } = parsed;
    const repoId = `${owner}/${name}`;

    // Each analysis costs ~28 GitHub requests and one LLM call (prompt is capped near 1,500 tokens).
    const usageCheck = await reserveUsage(req, 2500);
    if (!usageCheck.allowed) {
      return Response.json(
        { error: usageCheck.reason || "Usage limit exceeded", retryAfter: usageCheck.retryAfter },
        { status: 429 },
      );
    }

    const headers: HeadersInit = {
      "User-Agent": "gitlore",
      Accept: "application/vnd.github+json",
    };

    const pat = process.env.GITHUB_PAT;
    if (pat) {
      headers.Authorization = `Bearer ${pat}`;
    }

    // Metadata, README and tree are independent, so request them together.
    const readmePromise = fetch(
      `https://raw.githubusercontent.com/${owner}/${name}/HEAD/README.md`,
      { headers: { "User-Agent": "gitlore" } },
    )
      .then((res) => (res.ok ? res.text() : ""))
      .catch(() => "");
    const treePromise = fetchRepoTree(owner, name);
    treePromise.catch(() => {}); // surfaced by the await below; silences the early-return path

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers,
    });

    if (!repoRes.ok) {
      const status = repoRes.status;
      return Response.json(
        {
          error:
            status === 404
              ? "Repository not found or not accessible."
              : "Failed to fetch repository metadata from GitHub.",
        },
        { status: 400 },
      );
    }

    const repo = (await repoRes.json()) as GitHubRepo;

    // The server's GitHub token may be able to see private repos; visitors must not.
    if (repo.private) {
      return Response.json({ error: "Repository not found or not accessible." }, { status: 400 });
    }

    const readme = await readmePromise;

    const optimizedReadme = readme ? readme.slice(0, 1500) : "[no readme]";

    const tree = await treePromise;
    const { stackRadar, hotspots } = calculateRepoStats(tree);

    const codeEntries = tree.filter(
      (entry) =>
        entry.type === "blob" &&
        /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|java|cs|rs|php|kt|swift)$/i.test(
          entry.path,
        ),
    );

    const limited = codeEntries.slice(0, 25);

    const documents: {
      id: string;
      text: string;
      path: string;
      startLine?: number;
      endLine?: number;
      metadata?: Record<string, unknown>;
    }[] = [];

    const fileSizes: Record<string, number> = {};
    for (const entry of tree) {
      if (entry.type === "blob") {
        fileSizes[entry.path] = entry.size ?? 0;
      }
    }

    let firstFileContent: string | null = null;

    // Fetch the sampled files concurrently; failed files are skipped.
    const fetched = await Promise.all(
      limited.map((entry) =>
        fetchRawFile(owner, name, entry.path)
          .then((text) => ({ entry, text }))
          .catch(() => null),
      ),
    );

    for (const file of fetched) {
      if (!file) continue;
      const { entry, text } = file;
      documents.push({
        id: entry.path,
        text,
        path: entry.path,
        metadata: {
          bytes: entry.size ?? text.length,
        },
      });
      fileSizes[entry.path] = entry.size ?? text.length;
      if (!firstFileContent) {
        firstFileContent = text;
      }
    }

    if (documents.length) {
      try {
        await inMemoryVectorStoreAdapter.upsertDocuments({
          repoId,
          documents,
        });
      } catch (embeddingError) {
        console.warn("Embeddings failed, continuing without RAG:", embeddingError);
      }
    }

    const sizeEntries = Object.entries(fileSizes);
    const maxSize =
      sizeEntries.length > 0
        ? Math.max(...sizeEntries.map(([, size]) => size))
        : 0;

    const allEntries = tree.map((entry) => {
      if (entry.type === "tree") {
        return {
          path: entry.path,
          type: "folder" as const,
          language: "",
          complexity: "green" as const,
        };
      } else {
        const ext = entry.path.split(".").pop() ?? "";
        const language =
          ext === "tsx" || ext === "jsx"
            ? "tsx"
            : ext === "ts"
              ? "ts"
              : ext === "js"
                ? "js"
                : ext;
        const size = fileSizes[entry.path] ?? entry.size ?? 0;
        const complexityScore =
          maxSize > 0 ? Math.round(40 + (60 * size) / maxSize) : 50;

        const complexityColor =
          complexityScore >= 80 ? "red" : complexityScore >= 65 ? "yellow" : "green";

        return {
          path: entry.path,
          type: "file" as const,
          language,
          complexity: complexityColor as "green" | "yellow" | "red",
        };
      }
    });

    
    const sampleFileTree = limited.slice(0, 10).map((entry) => {
      const ext = entry.path.split(".").pop() ?? "";
      const language =
        ext === "tsx" || ext === "jsx"
          ? "tsx"
          : ext === "ts"
            ? "ts"
            : ext === "js"
              ? "js"
              : ext;
      const size = fileSizes[entry.path] ?? 0;
      const complexityScore =
        maxSize > 0 ? Math.round(40 + (60 * size) / maxSize) : 50;

      const complexityColor =
        complexityScore >= 80 ? "red" : complexityScore >= 65 ? "yellow" : "green";

      return {
        path: entry.path,
        language,
        complexity: complexityColor as "green" | "yellow" | "red",
      };
    });

    const sampleCode =
      (firstFileContent &&
        (firstFileContent.length > 4000
          ? `${firstFileContent.slice(0, 4000)}\n// … truncated`
          : firstFileContent)) ||
      readme ||
      `// Sample view for ${repo.full_name}\n// Connect this Monaco editor to real code snippets during indexing.\n`;

    const elevatorPitch = await buildElevatorPitch(
      repo,
      optimizedReadme,
      tree,
      sampleCode,
    );

    return Response.json({
      repoId,
      repoUrl,
      owner,
      name,
      elevatorPitch,
      stackRadar,
      hotspots,
      sampleFileTree,
      fullFileTree: allEntries, 
      sampleCode,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in /api/analyze:", error);
    return Response.json(
      {
        error: errorMessage || "An unexpected error occurred while analyzing the repository.",
      },
      { status: 500 },
    );
  }
}

