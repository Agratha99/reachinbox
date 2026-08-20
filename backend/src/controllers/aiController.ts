import { Request, Response } from 'express';

export async function generateEmailTemplate(req: Request, res: Response) {
    const { prompt, tone = 'Professional' } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for AI email generation.' });
    }

    const topic = prompt.trim();
    const toneLabel = tone || 'Professional';

    // AI-generated templates with Spintax and merge variables
    const options = [
        {
            id: 'opt_1',
            title: `${toneLabel} Direct Offer`,
            subject: `{Quick question regarding|Ideas for|Streamlining} {{companyName}}`,
            body: `<p>{Hi|Hey|Hello} {{firstName}},</p>
<p>I came across {{companyName}} and was really impressed by your team's work in ${topic}.</p>
<p>{We recently helped a similar team|Our platform has enabled companies like yours to} automate email outreach and boost reply rates by over 35%.</p>
<p>{Would you be open to a quick 5-minute chat|Are you free for a brief call next Tuesday} to explore how this could work for {{companyName}}?</p>
<p>Best regards,<br/>Kataru Rahul</p>`,
        },
        {
            id: 'opt_2',
            title: `${toneLabel} Problem & Value Prop`,
            subject: `{Solving|Improving} outreach for {{companyName}}`,
            body: `<p>{Hi|Hey} {{firstName}},</p>
<p>{Most leaders in your space struggle with|One of the biggest hurdles for companies in} ${topic} is scaling outreach without getting flagged as spam.</p>
<p>ReachInbox solves this with automated spintax, multi-account sender rotation, and real-time open tracking.</p>
<p>{Worth a quick 2-minute look?|Open to taking a look at a brief demo?} Let me know!</p>
<p>Cheers,<br/>Kataru Rahul</p>`,
        },
    ];

    return res.json({
        success: true,
        prompt: topic,
        tone: toneLabel,
        templates: options,
    });
}
