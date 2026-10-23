import { NextResponse } from "next/server";
import { getProviderConnectionById } from "@/lib/localDb";
import { getProviderModels, PROVIDER_ID_TO_ALIAS } from "open-sse/config/providerModels.js";
import { isOpenAICompatibleProvider, isAnthropicCompatibleProvider, AI_PROVIDERS } from "@/shared/constants/providers";
import { UPDATER_CONFIG } from "@/shared/constants/config";
import { pingModelByKind } from "@/app/api/models/test/ping";

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * POST /api/providers/[id]/test-models
 * id can be either connectionId or providerId.
 * Optional JSON body:
 *   - modelIds: string[] (specific models to test)
 *   - concurrency: number (1-6, default 4)
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    let connection = await getProviderConnectionById(id);
    let providerId = connection ? connection.provider : id;

    // Check if provider exists in catalog if no connection matched
    if (!connection && !AI_PROVIDERS[providerId] && !PROVIDER_ID_TO_ALIAS[providerId]) {
      return NextResponse.json({ error: "Provider or connection not found" }, { status: 404 });
    }

    const isCompatible = isOpenAICompatibleProvider(providerId) || isAnthropicCompatibleProvider(providerId);
    const alias = PROVIDER_ID_TO_ALIAS[providerId] || providerId;

    let models = getProviderModels(alias);

    const baseUrl = `http://127.0.0.1:${process.env.PORT || UPDATER_CONFIG.appPort}`;

    // Compatible providers: fetch live model list if connection available
    if (isCompatible && models.length === 0 && connection) {
      try {
        const modelsRes = await fetch(`${baseUrl}/api/providers/${connection.id}/models`);
        if (modelsRes.ok) {
          const data = await modelsRes.json();
          models = (data.models || []).map((m) => ({ id: m.id || m.name, name: m.name || m.id }));
        }
      } catch {
        /* fallback to empty */
      }
    }

    // Filter to requested modelIds if provided
    if (Array.isArray(body.modelIds) && body.modelIds.length > 0) {
      const allowed = new Set(body.modelIds);
      models = models.filter((m) => allowed.has(m.id));
      // If requested custom models aren't in built-in list, include them as generic llm models
      for (const reqId of body.modelIds) {
        if (!models.some((m) => m.id === reqId)) {
          models.push({ id: reqId, name: reqId, kind: "llm" });
        }
      }
    }

    if (models.length === 0) {
      return NextResponse.json({ error: "No models configured for this provider" }, { status: 400 });
    }

    const concurrency = Math.min(Math.max(Number(body.concurrency) || 4, 1), 6);

    // Warm up with first model to trigger token refresh before parallel calls.
    const [first, ...rest] = models;
    const firstKind = first.kind || first.type || "llm";
    const firstResult = await pingModelByKind(`${alias}/${first.id}`, firstKind, baseUrl);
    const results = [{ modelId: first.id, name: first.name || first.id, ...firstResult }];

    if (rest.length > 0) {
      const restResults = await mapConcurrent(rest, concurrency, async (model) => {
        const result = await pingModelByKind(
          `${alias}/${model.id}`,
          model.kind || model.type || "llm",
          baseUrl
        );
        return { modelId: model.id, name: model.name || model.id, ...result };
      });
      results.push(...restResults);
    }

    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      provider: providerId,
      connectionId: connection?.id || null,
      total: results.length,
      passed,
      failed,
      results,
    });
  } catch (error) {
    console.log("Error testing models:", error);
    return NextResponse.json({ error: error.message || "Test failed" }, { status: 500 });
  }
}
