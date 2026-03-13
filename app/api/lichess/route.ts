// Fetch Opening Data from Lichess Explorer API

/* User Token not currently needed
import { initialize } from "equine";
initialize(process.env.LICHESS_API_TOKEN!);*/

export async function GET() {
    const res = await fetch(
        "https://explorer.lichess.ovh/masters?play=e2e4,e7e5",
        {
            headers: {
                "User-Agent": "chess-study-app",
                Accept: "application/json"
            }
        }
    );

    if (!res.ok) {
        const text = await res.text();
        return Response.json({ error: text}, { status: 500 });
    }

    const data = await res.json();

    /*return Response.json(data);
    Option for limiting data given*/
    return Response.json({
        totalWhite: data.white,
        totalDraws: data.draws,
        totalBlack: data.black,
        moves: data.moves
    }); 
}