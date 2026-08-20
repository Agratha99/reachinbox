// Spam trigger words heuristic scanner
const SPAM_TRIGGERS = [
    '100% free',
    'act now',
    'all natural',
    'apply now',
    'as seen on',
    'bargain',
    'be your own boss',
    'best price',
    'big bucks',
    'buy now',
    'cash bonus',
    'cash prize',
    'cheap',
    'claim your',
    'click here',
    'credit card offers',
    'double your income',
    'earn extra cash',
    'exclusive deal',
    'fast cash',
    'financial freedom',
    'free gift',
    'free info',
    'free trial',
    'get paid',
    'guaranteed',
    'make money',
    'no hidden cost',
    'no investment',
    'no risk',
    'once in a lifetime',
    'passwords',
    'risk free',
    'special promotion',
    'unbelievable deal',
    'urgent',
    'winner',
];

export interface SpamCheckResult {
    score: number; // 0 to 100
    foundWords: string[];
    level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function checkSpamScore(subject: string, body: string): SpamCheckResult {
    const text = `${subject} ${body}`.toLowerCase();
    const foundWords: string[] = [];

    SPAM_TRIGGERS.forEach((word) => {
        if (text.includes(word)) {
            foundWords.push(word);
        }
    });

    const score = Math.min(100, foundWords.length * 25);
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (score >= 50) level = 'HIGH';
    else if (score >= 25) level = 'MEDIUM';

    return {
        score,
        foundWords,
        level,
    };
}
