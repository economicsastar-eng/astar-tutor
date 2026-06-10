DO $$
DECLARE
  rec RECORD;
  v_lesson_id UUID;
  v_summary_so INT;
  v_new_content TEXT;
  v_has_q BOOLEAN;
  v_q JSONB;
  v_block_id UUID;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('4f29ccc3-39a0-4762-8335-595d9cee8fec'::uuid,
'## Voluntary and Involuntary Unemployment

The AQA spec requires you to distinguish between voluntary and involuntary unemployment.

Voluntary unemployment: Workers choose not to work at the going wage rate. They could find a job but the wage offered is below the level at which they are willing to work. Examples: someone waiting for a better job offer; someone who prefers leisure to the wage available; someone whose benefits provide more than the available wage (the replacement ratio is too high).

Voluntary unemployment exists at the natural rate — frictional and structural unemployment include voluntary elements (workers choosing to search longer for a better match).

Involuntary unemployment: Workers are willing and able to work at the going wage rate but cannot find a job. They want to work at current wages but there are simply not enough jobs available. This is the defining feature of cyclical (demand-deficient) unemployment — during a recession, aggregate demand is insufficient to employ everyone who wants to work.

The distinction matters for policy: voluntary unemployment is addressed by supply-side policies (making work more attractive through welfare reform, training). Involuntary unemployment is addressed by demand-side stimulus (fiscal expansion, rate cuts) because the problem is insufficient aggregate demand, not unwillingness to work.',
        TRUE,
        '{"q":"A worker is willing to accept any job at the current market wage but cannot find one because firms have cut hiring during a recession. This worker is:","a":"Voluntarily unemployed","b":"Frictionally unemployed","c":"Involuntarily unemployed — willing to work at the going wage but unable to find a job due to deficient demand","d":"Structurally unemployed","correct":"C","explanation":"Involuntary unemployment means wanting to work at the going wage but being unable to find a job. During a recession, aggregate demand falls, firms cut production and hiring — creating a pool of workers who are involuntarily unemployed. This is the core of cyclical unemployment and the primary justification for Keynesian demand management."}'::jsonb),

      ('f8a30dcd-dab8-4753-8a7e-3d60b03c3284'::uuid,
'## Causes of Cyclical Instability

The AQA spec explicitly requires knowledge of why economic cycles happen — not just what the phases look like. Key causes:

Excessive growth in credit and levels of debt: When banks lend too freely (low interest rates, relaxed lending standards), households and firms borrow more than they can sustainably repay. This creates an artificial demand boom. When the credit tightens — because interest rates rise or confidence falls — spending collapses as borrowers retrench. The 2008 financial crisis was fundamentally a credit cycle: excessive mortgage lending created a boom; the credit crunch caused the bust.

Asset price bubbles: When the price of assets (houses, shares, cryptocurrency) rises far above their fundamental value, driven by speculation and ''greater fool'' thinking (''I know it''s overvalued but I can sell to someone else at an even higher price''). When the bubble bursts, wealth is destroyed → negative wealth effect → consumption collapses → recession.

Destabilising speculation and herding: Financial market participants often follow each other rather than making independent assessments — herd behaviour. If enough investors buy, prices rise, attracting more buyers, driving prices higher still. This is self-reinforcing until sentiment reverses — then everyone sells at once, crashing the market. Herding amplifies both booms and busts.

Animal spirits (Keynes): Investment decisions are not purely based on rational cost-benefit analysis. Business confidence — what Keynes called ''animal spirits'' — plays a huge role. When entrepreneurs feel optimistic, they invest heavily → AD rises → growth. When confidence collapses (even without a clear rational cause), investment dries up → AD falls → recession. Animal spirits create self-fulfilling cycles: confidence → investment → growth → more confidence (and the reverse).',
        FALSE, NULL::jsonb),

      ('a9398733-e0fc-408a-8a78-85209850d02f'::uuid,
'## Disinflation vs Deflation — Know the Difference

Students often confuse these two terms. The AQA spec requires you to distinguish them.

Inflation: The general price level is rising (e.g. CPI goes from 100 to 103 — prices rose 3%).

Disinflation: The rate of inflation is falling, but prices are still rising. Inflation slows down but does not turn negative. Example: inflation falls from 6% to 3%. Prices are still going up — just more slowly than before.

Deflation: The general price level is falling — negative inflation. The CPI actually decreases. Example: CPI falls from 103 to 101. Prices have dropped.

Why the distinction matters for policy: Disinflation is generally a sign that anti-inflationary policy (higher interest rates) is working — the economy is cooling. This is usually welcome. Deflation, by contrast, is potentially dangerous — it can trigger delayed spending, rising real debt burdens, and a deflationary spiral. The policy response to deflation (aggressive rate cuts, QE, fiscal stimulus) is very different from the response to disinflation (hold course, possibly ease off the brakes).

Note: ''deflationary policies'' means policies that reduce aggregate demand (e.g. higher taxes, higher interest rates). They do NOT necessarily cause deflation — they may just cause disinflation.',
        FALSE, NULL::jsonb),

      ('8acbdfa7-77a5-4b2c-a1a0-234b06a14a89'::uuid,
'## The Determinants of Saving and the Saving ≠ Investment Distinction

The AQA spec explicitly requires you to understand saving and how it differs from investment.

Determinants of saving:
- Income level: higher income → higher saving (both absolute and as a proportion of income)
- Interest rates: higher rates reward saving → may increase saving (substitution effect). But the income effect can work the other way — a saver earning more interest needs to save less to reach their target.
- Consumer confidence: if consumers fear a recession, precautionary saving rises
- Availability of credit: easy credit reduces the need to save before purchasing
- Inflation: high inflation erodes the real value of savings → may discourage saving
- Cultural and demographic factors: ageing populations may save more for retirement

Saving is NOT the same as investment: In everyday language, people say ''I''m investing in a savings account.'' In economics, saving and investment are completely different things:
- Saving (S): household income not spent on consumption — held in banks or financial assets. It is a withdrawal from the circular flow.
- Investment (I): firm spending on capital goods (machinery, buildings, equipment) to increase productive capacity. It is an injection into the circular flow.

The two are linked through the banking system (savings are deposited → banks lend to firms for investment), but they are decided by different people with different motives. Saving is a household decision. Investment is a firm decision. They do not automatically equal each other — and when they diverge (saving rises but investment does not), the economy can fall into recession (the paradox of thrift).',
        FALSE, NULL::jsonb),

      ('e6deb18d-fbb6-4b91-ad9e-5ee89f9b9655'::uuid,
'## Factor Immobility as a Source of Market Failure

The AQA spec lists immobility of factors of production as a cause of market failure alongside externalities, public goods, and information failure.

Geographical immobility: Workers cannot easily move to where jobs are. Housing costs, family ties, school places, cultural attachment, and financial barriers prevent relocation. A worker unemployed in Sunderland may not move to London — even if there are vacancies — because they cannot afford London housing. This means labour surpluses persist in some regions while shortages persist in others. The price mechanism fails to clear the labour market because the resource (workers) cannot flow to its highest-valued use.

Occupational immobility: Workers cannot easily switch between occupations. A redundant steelworker cannot immediately become a software developer — they lack the skills, qualifications, and training. Occupational immobility means that even when new industries are growing (creating demand for workers), unemployed workers from declining industries cannot fill those vacancies without significant retraining.

Why this is market failure: In a perfectly functioning market, labour would flow to wherever wages are highest — ensuring efficient allocation. Geographical and occupational immobility prevent this adjustment, creating persistent unemployment in some areas/sectors and shortages in others. Resources are misallocated — the economy operates below its potential.',
        FALSE, NULL::jsonb),

      ('d8eef1a0-019d-47d5-b1f6-3c25686c7a70'::uuid,
'## Public Ownership and Nationalisation

The AQA spec (4.1.8.8) requires knowledge of public ownership as well as privatisation.

Public ownership (nationalisation) means the government owns and operates an industry — the state is both owner and producer. The UK nationalised railways, coal, steel, electricity, gas, telecoms, and airlines after 1945 under Attlee''s government. Most were privatised under Thatcher in the 1980s.

Arguments FOR public ownership:
- Natural monopolies (water, rail track, electricity grid) may be better run as public services — they are monopolies regardless of ownership, so profit extraction by private shareholders just transfers consumer surplus without improving efficiency
- Removes the profit motive from essential services — decisions made in the public interest, not to maximise shareholder returns
- Can cross-subsidise unprofitable but socially valuable services (rural bus routes, off-peak trains)
- Long-term investment horizon — public firms can invest for 20–30 year paybacks without shareholder pressure for short-term returns

Arguments AGAINST public ownership:
- Lack of profit motive → X-inefficiency. Publicly owned firms may have bloated workforces, poor cost control, and slow innovation
- Political interference: investment decisions driven by electoral considerations rather than economic efficiency
- Soft budget constraint: publicly owned firms can always go back to the Treasury for more money — no discipline of potential bankruptcy
- History: many nationalised UK industries were widely seen as inefficient and unresponsive to consumers by the 1970s

The debate has revived in recent years — particularly around rail (calls to renationalise following poor performance by private operators) and water (anger over pollution and dividend extraction by privatised water companies).',
        FALSE, NULL::jsonb)
    ) AS t(lesson_id, new_content, has_q, q_data)
  LOOP
    v_lesson_id := rec.lesson_id;
    v_new_content := rec.new_content;
    v_has_q := rec.has_q;
    v_q := rec.q_data;

    SELECT MIN(sort_order) INTO v_summary_so
    FROM lesson_blocks WHERE lesson_id = v_lesson_id AND block_type = 'summary';

    IF v_summary_so IS NULL THEN
      SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_summary_so
      FROM lesson_blocks WHERE lesson_id = v_lesson_id;
    ELSE
      UPDATE lesson_blocks
        SET sort_order = sort_order + 2
        WHERE lesson_id = v_lesson_id AND sort_order >= v_summary_so;
    END IF;

    INSERT INTO lesson_blocks (id, lesson_id, block_type, sort_order, content_markdown)
    VALUES (gen_random_uuid(), v_lesson_id, 'content', v_summary_so, v_new_content);

    IF v_has_q THEN
      INSERT INTO lesson_blocks (id, lesson_id, block_type, sort_order)
      VALUES (gen_random_uuid(), v_lesson_id, 'question', v_summary_so + 1)
      RETURNING id INTO v_block_id;

      INSERT INTO quiz_questions (
        id, lesson_id, lesson_block_id, question_text,
        option_a, option_b, option_c, option_d,
        correct_option, explanation, sort_order
      ) VALUES (
        gen_random_uuid(), v_lesson_id, v_block_id,
        v_q->>'q', v_q->>'a', v_q->>'b', v_q->>'c', v_q->>'d',
        v_q->>'correct', v_q->>'explanation',
        (SELECT COALESCE(MAX(sort_order),0)+1 FROM quiz_questions WHERE lesson_id = v_lesson_id)
      );
    END IF;
  END LOOP;
END $$;