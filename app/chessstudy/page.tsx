"use client";

import Chessboard from "@/components/Chessboard";
import Header from "@/components/Global/Header";
import { useEffect, useState } from "react";

type LichessMove = {
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
}

type LichessResponse = {
    totalWhite: number;
    totalBlack: number;
    totalDraws: number;
    moves: LichessMove[]
}

export default function Home() {
    // Opening data from backend
    const [data, setData] = useState<LichessResponse | null> (null);

    // Handling Lichess API Errors
    const [error, setError] = useState<string | null>(null)

    // Actual data fetch from backend
    useEffect(() => {
        async function loadData() {
        try {
            const res = await fetch("/api/lichess")
            if (!res.ok) {
                throw new Error("Lichess API is unavailable")
            }

            const json = await res.json();
            if (json.error) {
                throw new Error("Lichess API returned an error")
            }
            setData(json)
        } catch (err) {
            console.error(err)
            setError("Opening Database Unavailable. Tomorrow, Maybe?")
        }
    }
    loadData();}, []);

    // Error Page
    if (error) {
        return (
            <>
            <Header/>
            <h1 className="page-title-heading">Chess Study</h1>
            <p>Opening Database is Down</p>
            <p>Error: {error}</p>
            <Chessboard/>
            </>
        )
    }
    
    return (
    <>
    <Header/>
    <h1 className="page-title-heading">Chess Study</h1>
    
    {/* Opening Data Fetching*/}
    {!data && <p>Loading...</p>}
    
    {data && (
        <div>
        <p>White Wins: {data.totalWhite}</p>
        <p>Draws: {data.totalDraws}</p>
        <p>Black Wins: {data.totalBlack}</p>

        <h3>Next Moves</h3>
        {data.moves.map((move) => (
        <div key={move.uci}>
            {move.san} — W:{move.white} D:{move.draws} B:{move.black}
        </div>
        ))}
    </div>
    )}
    
    <div className="features-section">
        <h1 className="page-subheading">Features</h1>
        <h2 className="feature-element">Visualization</h2>
        <h2 className="feature-element">Repertoire</h2>
        <h2 className="feature-element">Opening Practice</h2>
    </div>
    </>
);
}
