import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

// Fix for TypeScript/ES module compatibility with @babel/traverse
const traverseDefault =
  typeof traverse === "function" ? traverse : (traverse as any).default;

/**
 * Extract behavioral/semantic features from code.
 * Focuses on control flow, calls, operators. Ignores identifiers/formatting.
 */
function extractFeatures(code: string): string[] {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const feats: string[] = [];

  traverseDefault(ast, {
    enter(path: any) {
      switch (path.node.type) {
        case "IfStatement":
          feats.push("if");
          break;
        case "ForStatement":
        case "WhileStatement":
        case "DoWhileStatement":
          feats.push("loop");
          break;
        case "SwitchStatement":
          feats.push("switch");
          break;
        case "FunctionDeclaration":
        case "ArrowFunctionExpression":
        case "FunctionExpression":
          feats.push("fn");
          break;
        case "CallExpression":
          if (path.node.callee && path.node.callee.type === "Identifier") {
            feats.push(`call:${path.node.callee.name}`);
          } else {
            feats.push("call:anon");
          }
          break;
        case "BinaryExpression":
          feats.push(`binop:${(path.node as any).operator}`);
          break;
        case "ReturnStatement":
          feats.push("return");
          break;
      }
    },
  });

  return feats;
}

/** Jaccard similarity on feature sets (0..1) */
export function behavioralSimilarity(a: string, b: string): number {
  const A = new Set(extractFeatures(a));
  const B = new Set(extractFeatures(b));
  if (A.size === 0 && B.size === 0) return 0;

  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = new Set([...A, ...B]).size;
  return inter / union;
}

export function isPlagiarized(a: string, b: string, threshold = 0.8) {
  return behavioralSimilarity(a, b) >= threshold;
}
