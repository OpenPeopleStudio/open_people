/**
 * RAG Evaluation Suite
 *
 * Retrieval tests (MRR/recall), plus answer-grounding checks.
 * Ties into hallucination detection for comprehensive quality assessment.
 */

import OpenAI from "openai";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { explainableSearch } from "./retrieval";
import type {
  EvalTestSet,
  EvalTestCase,
  EvalRun,
  EvalCaseResult,
  EvalMetrics,
  RunEvalRequest,
  RunEvalResponse,
} from "@/types/rag";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ═══════════════════════════════════════════════════════════════════════════
// Test Set Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new eval test set.
 */
export async function createEvalTestSet(options: {
  tenantId?: string;
  name: string;
  description?: string;
  knowledgeBases?: string[];
  createdBy?: string;
}): Promise<EvalTestSet> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_eval_test_sets")
    .insert({
      tenant_id: options.tenantId,
      name: options.name,
      description: options.description,
      knowledge_bases: options.knowledgeBases,
      created_by: options.createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test set: ${error.message}`);
  }

  return data as EvalTestSet;
}

/**
 * Add a test case to a test set.
 */
export async function addEvalTestCase(options: {
  testSetId: string;
  query: string;
  queryIntent?: string;
  expectedChunks?: string[];
  expectedDocuments?: string[];
  expectedAnswer?: string;
  minRecall?: number;
  minMrr?: number;
  minGroundingScore?: number;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
}): Promise<EvalTestCase> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_eval_test_cases")
    .insert({
      test_set_id: options.testSetId,
      query: options.query,
      query_intent: options.queryIntent,
      expected_chunks: options.expectedChunks,
      expected_documents: options.expectedDocuments,
      expected_answer: options.expectedAnswer,
      min_recall: options.minRecall ?? 0.8,
      min_mrr: options.minMrr ?? 0.7,
      min_grounding_score: options.minGroundingScore ?? 0.8,
      category: options.category,
      difficulty: options.difficulty,
      tags: options.tags,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add test case: ${error.message}`);
  }

  // Update test set count
  await supabase.rpc("update_test_set_count", { p_test_set_id: options.testSetId });

  return data as EvalTestCase;
}

/**
 * Get test cases for a test set.
 */
export async function getTestCases(testSetId: string): Promise<EvalTestCase[]> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_eval_test_cases")
    .select("*")
    .eq("test_set_id", testSetId)
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    throw new Error(`Failed to get test cases: ${error.message}`);
  }

  return (data || []) as EvalTestCase[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Eval Run Execution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run evaluation on a test set.
 */
export async function runEval(request: RunEvalRequest): Promise<RunEvalResponse> {
  const supabase = await createSupabaseAdmin();

  // Get test set
  const { data: testSet, error: testSetError } = await supabase
    .from("kb_eval_test_sets")
    .select("*")
    .eq("id", request.test_set_id)
    .single();

  if (testSetError || !testSet) {
    throw new Error(`Test set not found: ${request.test_set_id}`);
  }

  // Get test cases
  let testCases = await getTestCases(request.test_set_id);

  // Filter by specific IDs if provided
  if (request.test_case_ids && request.test_case_ids.length > 0) {
    testCases = testCases.filter((tc) => request.test_case_ids!.includes(tc.id));
  }

  // Sample if requested
  if (request.run_type === "sample" && request.sample_size) {
    testCases = sampleArray(testCases, request.sample_size);
  }

  if (testCases.length === 0) {
    throw new Error("No test cases to run");
  }

  // Create eval run record
  const { data: evalRun, error: runError } = await supabase
    .from("kb_eval_runs")
    .insert({
      test_set_id: request.test_set_id,
      run_type: request.run_type ?? "full",
      search_config: request.search_config ?? {},
      total_cases: testCases.length,
      status: "running",
    })
    .select()
    .single();

  if (runError || !evalRun) {
    throw new Error(`Failed to create eval run: ${runError?.message}`);
  }

  // Run evaluations
  const results: EvalCaseResult[] = [];
  let passed = 0;
  let failed = 0;
  let totalLatency = 0;

  for (const testCase of testCases) {
    const result = await evaluateTestCase(testCase, evalRun.id);
    results.push(result);

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }

    if (result.latency_ms) {
      totalLatency += result.latency_ms;
    }
  }

  // Calculate aggregate metrics
  const metrics = calculateAggregateMetrics(results);

  // Update eval run with results
  await supabase
    .from("kb_eval_runs")
    .update({
      passed_cases: passed,
      failed_cases: failed,
      avg_recall: metrics.recall,
      avg_precision: metrics.precision,
      avg_mrr: metrics.mrr,
      avg_ndcg: metrics.ndcg,
      avg_grounding_score: metrics.grounding_score,
      avg_faithfulness_score: metrics.faithfulness_score,
      hallucination_count: results.filter((r) => r.has_hallucination).length,
      total_latency_ms: totalLatency,
      avg_latency_ms: Math.round(totalLatency / results.length),
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", evalRun.id);

  // Update test set
  await supabase
    .from("kb_eval_test_sets")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_score: metrics.pass_rate,
    })
    .eq("id", request.test_set_id);

  return {
    eval_run_id: evalRun.id,
    status: "completed",
    metrics,
    failed_cases: results
      .filter((r) => !r.passed)
      .map((r) => ({
        test_case_id: r.test_case_id,
        query: testCases.find((tc) => tc.id === r.test_case_id)?.query || "",
        reason: getFailureReason(r),
      })),
  };
}

/**
 * Evaluate a single test case.
 */
async function evaluateTestCase(
  testCase: EvalTestCase,
  evalRunId: string
): Promise<EvalCaseResult> {
  const supabase = await createSupabaseAdmin();
  const startTime = Date.now();

  try {
    // Run retrieval
    const searchResult = await explainableSearch({
      query: testCase.query,
      top_k: 10,
      min_score: 0.5,
      explain: true,
    });

    const retrievedChunks = searchResult.results.map((r) => r.chunk.chunk_id);
    const latency = Date.now() - startTime;

    // Calculate retrieval metrics
    const expectedChunks = testCase.expected_chunks || [];
    const expectedDocs = testCase.expected_documents || [];

    const recall = calculateRecall(retrievedChunks, expectedChunks);
    const mrr = calculateMRR(retrievedChunks, expectedChunks);
    const precision = calculatePrecision(retrievedChunks, expectedChunks, 10);
    const ndcg = calculateNDCG(retrievedChunks, expectedChunks);

    // Calculate grounding score if expected answer is provided
    let groundingScore: number | undefined;
    let faithfulnessScore: number | undefined;
    let generatedAnswer: string | undefined;
    let hasHallucination = false;
    let hallucinationDetails: string | undefined;

    if (testCase.expected_answer && searchResult.results.length > 0) {
      // Generate answer from retrieved context
      const context = searchResult.results
        .slice(0, 5)
        .map((r) => r.chunk.content)
        .join("\n\n");

      const answerResult = await generateAndEvaluateAnswer(
        testCase.query,
        context,
        testCase.expected_answer
      );

      generatedAnswer = answerResult.answer;
      groundingScore = answerResult.grounding;
      faithfulnessScore = answerResult.faithfulness;
      hasHallucination = answerResult.hasHallucination;
      hallucinationDetails = answerResult.hallucinationDetails;
    }

    // Determine if test passed
    const passed =
      recall >= testCase.min_recall &&
      mrr >= testCase.min_mrr &&
      (!testCase.expected_answer || (groundingScore ?? 1) >= testCase.min_grounding_score);

    // Store result
    const result: EvalCaseResult = {
      id: "", // Will be set by DB
      eval_run_id: evalRunId,
      test_case_id: testCase.id,
      passed,
      recall,
      precision_at_k: precision,
      mrr,
      ndcg,
      retrieved_chunks: retrievedChunks,
      retrieved_ranks: Object.fromEntries(retrievedChunks.map((id, i) => [id, i + 1])),
      latency_ms: latency,
      debug_info: {
        search_result_count: searchResult.results.length,
        expected_chunks_count: expectedChunks.length,
        expected_docs_count: expectedDocs.length,
      },
      ...(generatedAnswer !== undefined ? { generated_answer: generatedAnswer } : {}),
      ...(groundingScore !== undefined ? { grounding_score: groundingScore } : {}),
      ...(faithfulnessScore !== undefined ? { faithfulness_score: faithfulnessScore } : {}),
      ...(hasHallucination !== undefined ? { has_hallucination: hasHallucination } : {}),
      ...(hallucinationDetails !== undefined
        ? { hallucination_details: hallucinationDetails }
        : {}),
    };

    // Save to database
    const { data, error } = await supabase
      .from("kb_eval_case_results")
      .insert({
        eval_run_id: evalRunId,
        test_case_id: testCase.id,
        passed,
        recall,
        precision_at_k: precision,
        mrr,
        ndcg,
        retrieved_chunks: retrievedChunks,
        retrieved_ranks: result.retrieved_ranks,
        latency_ms: latency,
        debug_info: result.debug_info,
        ...(generatedAnswer !== undefined ? { generated_answer: generatedAnswer } : {}),
        ...(groundingScore !== undefined ? { grounding_score: groundingScore } : {}),
        ...(faithfulnessScore !== undefined ? { faithfulness_score: faithfulnessScore } : {}),
        ...(hasHallucination !== undefined ? { has_hallucination: hasHallucination } : {}),
        ...(hallucinationDetails !== undefined
          ? { hallucination_details: hallucinationDetails }
          : {}),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save eval case result:", error);
    }

    if (data) {
      result.id = data.id;
    }

    return result;
  } catch (error) {
    // Log error but don't fail entire run
    console.error(`Error evaluating test case ${testCase.id}:`, error);

    const result: EvalCaseResult = {
      id: "",
      eval_run_id: evalRunId,
      test_case_id: testCase.id,
      passed: false,
      latency_ms: Date.now() - startTime,
      debug_info: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };

    await supabase.from("kb_eval_case_results").insert({
      eval_run_id: evalRunId,
      test_case_id: testCase.id,
      passed: false,
      latency_ms: result.latency_ms,
      debug_info: result.debug_info,
    });

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Metrics Calculation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate recall: Retrieved relevant / Total relevant
 */
function calculateRecall(retrieved: string[], expected: string[]): number {
  if (expected.length === 0) return 1.0;
  const relevant = retrieved.filter((id) => expected.includes(id));
  return relevant.length / expected.length;
}

/**
 * Calculate precision@K: Relevant in top K / K
 */
function calculatePrecision(retrieved: string[], expected: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  if (topK.length === 0) return 0;
  const relevant = topK.filter((id) => expected.includes(id));
  return relevant.length / topK.length;
}

/**
 * Calculate MRR: 1 / rank of first relevant result
 */
function calculateMRR(retrieved: string[], expected: string[]): number {
  for (let i = 0; i < retrieved.length; i++) {
    if (expected.includes(retrieved[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

/**
 * Calculate NDCG (Normalized Discounted Cumulative Gain)
 */
function calculateNDCG(retrieved: string[], expected: string[]): number {
  if (expected.length === 0) return 1.0;

  // DCG
  let dcg = 0;
  for (let i = 0; i < retrieved.length; i++) {
    const rel = expected.includes(retrieved[i]) ? 1 : 0;
    dcg += rel / Math.log2(i + 2);
  }

  // Ideal DCG
  let idcg = 0;
  for (let i = 0; i < expected.length; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return idcg === 0 ? 0 : dcg / idcg;
}

/**
 * Calculate aggregate metrics from results.
 */
function calculateAggregateMetrics(results: EvalCaseResult[]): EvalMetrics {
  const validResults = results.filter((r) => r.recall !== undefined);

  if (validResults.length === 0) {
    return {
      recall: 0,
      precision: 0,
      mrr: 0,
      ndcg: 0,
      pass_rate: 0,
      avg_latency_ms: 0,
    };
  }

  const sum = (arr: (number | undefined)[]) =>
    arr.reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;

  const avg = (arr: (number | undefined)[]) => {
    const valid = arr.filter((x): x is number => x !== undefined);
    return valid.length > 0 ? sum(valid) / valid.length : 0;
  };

  const groundingResults = validResults.filter((r) => r.grounding_score !== undefined);
  const faithfulnessResults = validResults.filter((r) => r.faithfulness_score !== undefined);
  const hallucinationResults = validResults.filter((r) => r.has_hallucination !== undefined);

  const metrics: EvalMetrics = {
    recall: avg(validResults.map((r) => r.recall)),
    precision: avg(validResults.map((r) => r.precision_at_k)),
    mrr: avg(validResults.map((r) => r.mrr)),
    ndcg: avg(validResults.map((r) => r.ndcg)),
    pass_rate: results.filter((r) => r.passed).length / results.length,
    avg_latency_ms: avg(results.map((r) => r.latency_ms)),
  };

  if (groundingResults.length > 0) {
    metrics.grounding_score = avg(groundingResults.map((r) => r.grounding_score));
  }

  if (faithfulnessResults.length > 0) {
    metrics.faithfulness_score = avg(faithfulnessResults.map((r) => r.faithfulness_score));
  }

  if (hallucinationResults.length > 0) {
    metrics.hallucination_rate =
      hallucinationResults.filter((r) => r.has_hallucination).length /
      hallucinationResults.length;
  }

  return metrics;
}

/**
 * Get failure reason for a result.
 */
function getFailureReason(result: EvalCaseResult): string {
  const reasons: string[] = [];

  if (result.debug_info?.error) {
    return `Error: ${result.debug_info.error}`;
  }

  if (result.recall !== undefined && result.recall < 0.8) {
    reasons.push(`Low recall: ${(result.recall * 100).toFixed(1)}%`);
  }

  if (result.mrr !== undefined && result.mrr < 0.7) {
    reasons.push(`Low MRR: ${result.mrr.toFixed(3)}`);
  }

  if (result.grounding_score !== undefined && result.grounding_score < 0.8) {
    reasons.push(`Low grounding: ${(result.grounding_score * 100).toFixed(1)}%`);
  }

  if (result.has_hallucination) {
    reasons.push("Hallucination detected");
  }

  return reasons.join("; ") || "Unknown failure";
}

// ═══════════════════════════════════════════════════════════════════════════
// Answer Evaluation (Grounding & Hallucination)
// ═══════════════════════════════════════════════════════════════════════════

interface AnswerEvaluation {
  answer: string;
  grounding: number;
  faithfulness: number;
  hasHallucination: boolean;
  hallucinationDetails?: string;
}

/**
 * Generate an answer and evaluate its grounding.
 */
async function generateAndEvaluateAnswer(
  query: string,
  context: string,
  expectedAnswer: string
): Promise<AnswerEvaluation> {
  // Generate answer
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant. Answer the question based ONLY on the provided context. If the context doesn't contain enough information, say so.`,
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
    max_tokens: 500,
    temperature: 0,
  });

  const answer = completion.choices[0].message.content || "";

  // Evaluate grounding and hallucination
  const evalCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert evaluator. Evaluate the answer against the context and expected answer.

Return a JSON object with:
- grounding: 0-1 score of how well the answer is grounded in the context
- faithfulness: 0-1 score of how well the answer matches the expected answer
- hasHallucination: boolean indicating if the answer contains information not in the context
- hallucinationDetails: if hasHallucination is true, explain what was hallucinated

Only return valid JSON, no other text.`,
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nGenerated Answer:\n${answer}\n\nExpected Answer:\n${expectedAnswer}`,
      },
    ],
    max_tokens: 300,
    temperature: 0,
  });

  const evalContent = evalCompletion.choices[0].message.content || "{}";

  try {
    const evalResult = JSON.parse(evalContent);
    return {
      answer,
      grounding: evalResult.grounding ?? 0.5,
      faithfulness: evalResult.faithfulness ?? 0.5,
      hasHallucination: evalResult.hasHallucination ?? false,
      hallucinationDetails: evalResult.hallucinationDetails,
    };
  } catch {
    return {
      answer,
      grounding: 0.5,
      faithfulness: 0.5,
      hasHallucination: false,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Random sample from array.
 */
function sampleArray<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

/**
 * Get eval run with results.
 */
export async function getEvalRun(evalRunId: string): Promise<EvalRun & { results?: EvalCaseResult[] }> {
  const supabase = await createSupabaseAdmin();

  const { data: run, error } = await supabase
    .from("kb_eval_runs")
    .select("*")
    .eq("id", evalRunId)
    .single();

  if (error || !run) {
    throw new Error(`Eval run not found: ${evalRunId}`);
  }

  const { data: results } = await supabase
    .from("kb_eval_case_results")
    .select("*")
    .eq("eval_run_id", evalRunId)
    .order("created_at");

  return {
    ...(run as EvalRun),
    results: (results || []) as EvalCaseResult[],
  };
}
