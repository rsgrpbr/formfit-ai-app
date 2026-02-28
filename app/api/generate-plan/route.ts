import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface DayInput {
  day_number: number;
  name: string;
  is_rest: boolean;
  exercises: { slug: string; sets: number; reps: number; rest_seconds: number }[];
}

interface PlanJson {
  name: string;
  days: DayInput[];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { userId, objective, level, days_per_week, location } = body;
  if (!userId || !objective || !level || !days_per_week || !location) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Call Claude API via SDK
  let rawContent: string;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `Você é personal trainer. Gere plano semanal em JSON usando APENAS esses exercícios:
squat, pushup, plank, lunge, glute_bridge, side_plank, superman, mountain_climber, burpee.
Retorne APENAS JSON válido nesse formato exato, sem markdown:
{
  "name": "Nome do plano",
  "days": [
    {
      "day_number": 1,
      "name": "Nome do dia",
      "is_rest": false,
      "exercises": [
        { "slug": "squat", "sets": 3, "reps": 12, "rest_seconds": 60 }
      ]
    }
  ]
}`,
      messages: [{
        role: 'user',
        content: `Objetivo: ${objective}, Nível: ${level}, ${days_per_week} dias/semana, Local: ${location}.`,
      }],
    });
    rawContent = (message.content[0] as { type: string; text: string }).text ?? '';
  } catch (err) {
    console.error('[generate-plan] Anthropic SDK error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
  }

  // Strip possible ```json fences
  rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let plan: PlanJson;
  try {
    plan = JSON.parse(rawContent);
  } catch {
    console.error('[generate-plan] JSON parse error, raw:', rawContent);
    return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 });
  }

  // 2. Lookup exercise slugs → UUID map
  const supabase = await createAdminClient();
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, slug');
  const slugToId = Object.fromEntries((exercises ?? []).map((e: { id: string; slug: string }) => [e.slug, e.id]));

  // 3. Deactivate old active plans
  await supabase
    .from('training_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  // 4. Insert training_plan
  const { data: planRow, error: planErr } = await supabase
    .from('training_plans')
    .insert({
      user_id: userId,
      name: plan.name,
      objective,
      level,
      days_per_week,
      is_active: true,
    })
    .select('id')
    .single();

  if (planErr || !planRow) {
    console.error('[generate-plan] insert plan error:', planErr?.message);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
  const planId = planRow.id as string;

  // 5. Insert days + exercises
  for (const day of plan.days) {
    const { data: dayRow, error: dayErr } = await supabase
      .from('plan_days')
      .insert({
        plan_id: planId,
        day_number: day.day_number,
        name: day.name,
        is_rest: day.is_rest ?? false,
      })
      .select('id')
      .single();

    if (dayErr || !dayRow) {
      console.error('[generate-plan] insert day error:', dayErr?.message);
      continue;
    }
    const dayId = dayRow.id as string;

    if (!day.is_rest && Array.isArray(day.exercises)) {
      const exerciseRows = day.exercises
        .filter((ex) => slugToId[ex.slug])
        .map((ex, idx) => ({
          day_id: dayId,
          exercise_id: slugToId[ex.slug],
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds ?? 60,
          order_index: idx,
        }));

      if (exerciseRows.length > 0) {
        const { error: exErr } = await supabase.from('plan_exercises').insert(exerciseRows);
        if (exErr) console.error('[generate-plan] insert exercises error:', exErr.message);
      }
    }
  }

  return NextResponse.json({ planId });
}
