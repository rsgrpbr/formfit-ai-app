/**
 * meMove — Geração de vídeos de exercícios via Kling AI
 *
 * Execução:
 *   npx tsx scripts/generate-videos.ts
 *
 * Pré-requisitos:
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *   - Bucket "assets" criado no Supabase Storage (público)
 *   - Migration 005_video_url.sql aplicada
 */

import { readFileSync } from 'fs';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ── Carregar .env.local ───────────────────────────────────
try {
  const raw = readFileSync('.env.local', 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {
  // Variáveis já definidas no ambiente — ok
}

// ── Kling AI credentials ──────────────────────────────────
const KLING_ACCESS_KEY = 'A8DKKE993APmM9YYt3nTRE8gpHMQHGpT';
const KLING_SECRET_KEY = 'pybGBAnmEAEretRhdBheGekdngbPhJey';
const KLING_BASE = 'https://api.klingai.com';

// ── Supabase (service role) ───────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STORAGE_BUCKET = 'assets';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── JWT ───────────────────────────────────────────────────
function makeKlingJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: KLING_ACCESS_KEY,
    exp: now + 1800,
    nbf: now - 5,
  })).toString('base64url');
  const sig = createHmac('sha256', KLING_SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// ── HTTP helpers ──────────────────────────────────────────
async function klingPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${KLING_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${makeKlingJWT()}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}

async function klingGet<T>(path: string): Promise<T> {
  const res = await fetch(`${KLING_BASE}${path}`, {
    headers: { Authorization: `Bearer ${makeKlingJWT()}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Exercícios ────────────────────────────────────────────
const EXERCISES: Array<{ slug: string; prompt: string }> = [
  {
    slug: 'squat',
    prompt: 'Athletic person performing squat with perfect form, side view, dark background, studio lighting',
  },
  {
    slug: 'pushup',
    prompt: 'Athletic person performing push-up with perfect form, side view, dark background',
  },
  {
    slug: 'plank',
    prompt: 'Athletic person holding plank position with perfect form, side view, dark background',
  },
  {
    slug: 'lunge',
    prompt: 'Athletic person performing lunge with perfect form, side view, dark background',
  },
  {
    slug: 'glute_bridge',
    prompt: 'Athletic person performing glute bridge with perfect form, side view, dark background',
  },
  {
    slug: 'side_plank',
    prompt: 'Athletic person holding side plank with perfect form, dark background',
  },
  {
    slug: 'superman',
    prompt: 'Athletic person performing superman exercise with perfect form, dark background',
  },
  {
    slug: 'mountain_climber',
    prompt: 'Athletic person performing mountain climbers with perfect form, side view, dark background',
  },
  {
    slug: 'burpee',
    prompt: 'Athletic person performing burpee with perfect form, side view, dark background',
  },
];

// ── Tipos Kling ───────────────────────────────────────────
interface KlingCreateResponse {
  code: number;
  message: string;
  data: { task_id: string; task_status: string };
}

interface KlingStatusResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed';
    task_status_msg?: string;
    task_result?: {
      videos: Array<{ id: string; url: string; duration: string }>;
    };
  };
}

// ── Pipeline por exercício ────────────────────────────────
async function processExercise(exercise: { slug: string; prompt: string }): Promise<string> {
  const { slug, prompt } = exercise;

  // 1. Criar tarefa de geração
  const created = await klingPost<KlingCreateResponse>('/v1/videos/text2video', {
    model_name: 'kling-v1',
    prompt,
    duration: '5',
    aspect_ratio: '9:16',
  });

  if (created.code !== 0) {
    throw new Error(`Criação falhou (code=${created.code}): ${created.message}`);
  }

  const taskId = created.data.task_id;
  console.log(`  Task ID: ${taskId}`);

  // 2. Polling — até 60 tentativas × 10s = 10 min
  let videoUrl = '';
  const MAX_ATTEMPTS = 60;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await sleep(10_000);

    const status = await klingGet<KlingStatusResponse>(`/v1/videos/text2video/${taskId}`);

    if (status.code !== 0) {
      throw new Error(`Status check falhou (code=${status.code}): ${status.message}`);
    }

    const { task_status, task_status_msg, task_result } = status.data;
    console.log(`  [${attempt}/${MAX_ATTEMPTS}] status=${task_status}`);

    if (task_status === 'succeed') {
      const videos = task_result?.videos ?? [];
      if (!videos.length) throw new Error('succeed mas sem vídeos no resultado');
      videoUrl = videos[0].url;
      break;
    }

    if (task_status === 'failed') {
      throw new Error(`Geração falhou: ${task_status_msg ?? 'sem mensagem'}`);
    }
  }

  if (!videoUrl) {
    throw new Error(`Timeout: vídeo não gerado em ${MAX_ATTEMPTS * 10}s`);
  }

  console.log(`  URL Kling: ${videoUrl.slice(0, 80)}...`);

  // 3. Download do vídeo
  const dlRes = await fetch(videoUrl);
  if (!dlRes.ok) throw new Error(`Download falhou: ${dlRes.status}`);
  const buffer = Buffer.from(await dlRes.arrayBuffer());
  console.log(`  Download: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

  // 4. Upload para Supabase Storage
  const storagePath = `videos/exercises/${slug}/main.mp4`;
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

  if (uploadErr) throw new Error(`Upload Supabase: ${uploadErr.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  console.log(`  Supabase: ${publicUrl}`);

  // 5. UPDATE exercises SET video_url
  const { error: dbErr } = await supabase
    .from('exercises')
    .update({ video_url: publicUrl })
    .eq('slug', slug);

  if (dbErr) throw new Error(`DB update: ${dbErr.message}`);

  return publicUrl;
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  meMove — Geração de Vídeos Kling   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Exercícios: ${EXERCISES.length}`);
  console.log(`Supabase:   ${SUPABASE_URL}`);
  console.log(`Bucket:     ${STORAGE_BUCKET}\n`);

  const results: Array<{ slug: string; url?: string; error?: string }> = [];

  for (const exercise of EXERCISES) {
    console.log(`\n▶ ${exercise.slug}`);
    try {
      const url = await processExercise(exercise);
      results.push({ slug: exercise.slug, url });
      console.log(`  ✓ Concluído`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ERRO: ${msg}`);
      results.push({ slug: exercise.slug, error: msg });
    }
  }

  // Resumo final
  console.log('\n══════════════════ RESUMO ══════════════════');
  let ok = 0;
  for (const r of results) {
    if (r.url) {
      console.log(`  ✓ ${r.slug.padEnd(18)} ${r.url}`);
      ok++;
    } else {
      console.log(`  ✗ ${r.slug.padEnd(18)} ${r.error}`);
    }
  }
  console.log(`\nTotal: ${ok}/${results.length} gerados com sucesso`);

  if (ok < results.length) process.exit(1);
}

main().catch(err => {
  console.error('\nFatal:', err);
  process.exit(1);
});
