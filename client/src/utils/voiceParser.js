/**
 * Kharchee - Voice Expense Smart NLP Parser
 * Extracts Friend, Amount, Transaction Direction (Given/Taken), and Description from spoken text.
 * Supports English, Hindi, and Hinglish phrases.
 */

export function parseVoiceExpense(transcript, friends = []) {
    if (!transcript || typeof transcript !== "string") {
        return { friend: null, amount: 0, type: "given", description: "" };
    }

    const text = transcript.toLowerCase().trim();

    // 1. EXTRACT AMOUNT
    let amount = 0;
    // Match numeric sequences (e.g. 500, 1200, 45.50)
    const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:rupees|rupee|rs|inr|rupay|rupaiye|bucks)?/i) || text.match(/\b(\d+)\b/);
    if (amountMatch && amountMatch[1]) {
        amount = parseFloat(amountMatch[1]);
    }

    // 2. EXTRACT FRIEND MATCH
    let matchedFriend = null;
    let friendMatchIndex = -1;

    // Search through user's friend list for exact or partial name match
    for (const friend of friends) {
        const fullName = friend.name.toLowerCase().trim();
        const firstName = fullName.split(" ")[0];

        if (text.includes(fullName)) {
            matchedFriend = friend;
            friendMatchIndex = text.indexOf(fullName);
            break;
        } else if (firstName.length >= 3 && text.includes(firstName)) {
            matchedFriend = friend;
            friendMatchIndex = text.indexOf(firstName);
            break;
        }
    }

    // 3. DETERMINE TRANSACTION DIRECTION (Given vs Taken)
    // Taken indicators: "liya", "le liya", "took", "borrowed", "received", "got from", "se liya"
    const isTaken = /\b(liya|le liya|took|borrowed|received|got|se liya|from)\b/i.test(text);
    const type = isTaken ? "taken" : "given";

    // 4. EXTRACT DESCRIPTION / REASON
    // Remove amount words, friend names, and common syntax noise
    let cleanDesc = text;

    if (amount > 0) {
        cleanDesc = cleanDesc.replace(new RegExp(`\\b${amount}\\b`, "g"), "");
    }

    if (matchedFriend) {
        cleanDesc = cleanDesc.replace(new RegExp(`\\b${matchedFriend.name.toLowerCase()}\\b`, "g"), "");
        cleanDesc = cleanDesc.replace(new RegExp(`\\b${matchedFriend.name.toLowerCase().split(" ")[0]}\\b`, "g"), "");
    }

    // Remove common voice command boilerplate words
    const noiseWords = [
        "add", "record", "enter", "rupees", "rupee", "rs", "inr", "rupay", "rupaiye",
        "for", "to", "from", "with", "ke", "liye", "ko", "se", "ka", "ki", "diya", "liya",
        "gave", "give", "paid", "spent", "please", "karo", "kardo", "hai", "tha"
    ];

    noiseWords.forEach((w) => {
        cleanDesc = cleanDesc.replace(new RegExp(`\\b${w}\\b`, "gi"), " ");
    });

    cleanDesc = cleanDesc.replace(/\s+/g, " ").trim();

    // Capitalize first letter of description
    const formattedDesc = cleanDesc
        ? cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1)
        : "Voice Recorded Expense";

    return {
        friend: matchedFriend,
        amount: isNaN(amount) ? 0 : amount,
        type, // 'given' (positive debt for friend) or 'taken' (negative debt for friend)
        description: formattedDesc,
        rawText: transcript
    };
}
