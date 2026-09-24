// Copyable AI prompts that accompany the Customer Architecture Map.

export const PERSONA_PROMPT = `You are helping me turn a Customer Architecture Map into one realistic, representative customer persona. Your job is to assist the analysis, not to manufacture a customer.

I will paste my completed map at the end. Some of it is based on evidence and some of it is assumption. Lines marked K are things I know from evidence. Lines marked A are assumptions. Treat anything unmarked as an assumption.

Work through the following in order.

1. AUDIT THE MAP FIRST
- Separate what is supported by evidence from what is assumed.
- Flag anything that reads like an assumption presented as a fact.
- Flag contradictions. For example: an "urgent" problem with no trigger, strong willingness to pay but no current spending, or a customer described as both price-sensitive and indifferent to price.
- List the important gaps: anything missing that would materially change the persona, especially the trigger to act, ability and willingness to pay, who decides, and how they look for solutions.

2. DO NOT INVENT WHAT MATTERS
If a gap is commercially important, do not fill it. Put it under "Open questions" instead. You may add small, commercially irrelevant details so the persona feels human (a first name, an approximate age, a plausible job title consistent with the map), but label them as illustrative.

3. WRITE ONE REPRESENTATIVE PERSONA
One realistic person who represents the most important customer in the map. Not an average of everyone, and not a dream customer. Use these headings:
- Snapshot: illustrative name, approximate age, role or life situation, and location only if it matters.
- Current situation: what is happening in their life or business today.
- The problem: what they experience, how often, how intensely, what it costs them, and what they have already tried.
- What makes them move: the trigger, and the cost of doing nothing.
- Inside their head: beliefs, fears, ambitions, doubts, identity, and how their thinking changes before, during and after looking for a solution.
- Buying reality: can they pay, will they pay, who decides, what value means to them, and what makes the purchase feel risky.
- Objections: the real reasons they might say "no" or "not yet".
- How they search: where they look for answers, who they listen to, what they would type into a search engine or ask an AI, and where they already spend money.
- The transformation: current state, desired state, and what they ultimately want to get, become, avoid or feel.
- Their language: 8 to 12 phrases they would naturally say about the problem. Plain, specific, unpolished. No marketing language.
- Not them: one or two people who look similar but should not be targeted, and why.

4. KEEP IT HONEST
- Do not make my assumptions sound like facts. Wherever a statement in the persona rests on an assumption, mark it [A].
- Do not invent statistics, market sizes, prices, research findings or quotes from real people.
- Do not infer sensitive characteristics such as health, religion, ethnicity, sexuality or political views unless they are explicitly in the map and genuinely relevant to the problem.
- Make the persona feel human without turning it into a short story. Leave out any backstory that would not change a business decision.

5. END WITH WHAT REMAINS UNCERTAIN
- Open questions: the most important things I still do not know, ranked by how much they would change the business if I am wrong.
- Cheapest next evidence: for the top three, the fastest real-world way to find out (a conversation, an observation, a small offer, a price test).

Here is my Customer Architecture Map:

[PASTE YOUR COMPLETED MAP HERE]`;

export const VISUAL_PERSONA_PROMPT = `Create a realistic, documentary-style portrait photograph of the person described below.

PERSON
[Copy only these details from your persona: illustrative first name, approximate age, role or life situation, the everyday setting they would realistically be in (for example a home office, a van, a restaurant kitchen after closing, a hospital car park, a small warehouse), time of day, and clothing appropriate to that setting. Do not include anything about their psychology, finances, fears or behaviour.]

DIRECTION
- Editorial or documentary photography. It should look like a real photograph of a real person, not an advertisement or a stock image.
- Natural light. Muted, natural colour. Medium or environmental framing with some space around the person.
- Realistic age, skin texture, posture and clothing. An ordinary, unposed moment in their actual environment.
- A natural expression: thoughtful, tired, focused, distracted or neutral. No exaggerated smiles, no triumphant poses, no pointing, no thumbs up.
- No success imagery: no sports cars, champagne, city skylines, private jets or laptops on beaches.
- No props unless they are listed above.
- No text, logos or watermarks.
- Do not derive appearance from personality, income or behaviour, and do not emphasise ethnicity, religion, health, disability or other sensitive characteristics.`;
