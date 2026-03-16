"use client"

import { useEffect, useRef } from "react"

export default function TicTacToe() {
    // We move these inside the component or use refs so they don't 
    // conflict if you ever have two games on one page.
    const turn = useRef("x");
    const turn_no = useRef(0);
    const gameOver = useRef(false);

    const startGame = () => {
        const turnDisplay = document.getElementById("turn");
        if (turnDisplay) {
            turnDisplay.innerHTML = `${turn.current.toUpperCase()} turn`;
            turnDisplay.style.display = "block";
        }
        const resultDisplay = document.getElementById("result");
        if (resultDisplay) resultDisplay.innerHTML = "";
    };

    const check_wins = () => {
        const one = document.querySelector(`button.one`)?.innerHTML || "";
        const two = document.querySelector(`button.two`)?.innerHTML || "";
        const three = document.querySelector(`button.three`)?.innerHTML || "";
        const four = document.querySelector(`button.four`)?.innerHTML || "";
        const five = document.querySelector(`button.five`)?.innerHTML || "";
        const six = document.querySelector(`button.six`)?.innerHTML || "";
        const seven = document.querySelector(`button.seven`)?.innerHTML || "";
        const eight = document.querySelector(`button.eight`)?.innerHTML || "";
        const nine = document.querySelector(`button.nine`)?.innerHTML || "";

        const wins = [
            [one, two, three],
            [four, five, six],
            [seven, eight, nine],
            [one, four, seven],
            [two, five, eight],
            [three, six, nine],
            [one, five, nine],
            [three, five, seven]
        ];

        const turnDisplay = document.getElementById("turn");
        const resultDisplay = document.getElementById("result");

        for (const pattern of wins) {
            const combination = pattern.join("");
            if (combination === "xxx" || combination === "ooo") {
                if (resultDisplay) resultDisplay.innerHTML = `${combination[0].toUpperCase()} Wins!`;
                if (turnDisplay) turnDisplay.style.display = "none";
                gameOver.current = true;
                return;
            }
        }

        if (turn_no.current === 9) {
            if (resultDisplay) resultDisplay.innerHTML = "It was a Draw!";
            gameOver.current = true;
        }
    };

    const placeLetter = (className: string) => {
        if (gameOver.current) return;

        const button = document.querySelector(`button.${className}`) as HTMLButtonElement;
        
        // Prevent overwriting a square already played
        if (!button || button.innerHTML !== "") return;

        button.innerHTML = turn.current;
        turn_no.current += 1;
        
        // Toggle turn
        turn.current = turn.current === "x" ? "o" : "x";
        
        const turnDisplay = document.getElementById("turn");
        if (turnDisplay) {
            turnDisplay.innerHTML = `${turn.current.toUpperCase()} turn`;
        }
        
        check_wins();
    };

    useEffect(() => {
        startGame();
    }, []);

    return (
        <>
            <h2 className="project-link">Old Project: Tic Tac Toe Game</h2>
            <div className="info-grid">
                <div><p className="ttt-subtext" id="result"></p></div>
                <div><p className="ttt-subtext" id="turn"></p></div>
            </div>

            <div className="grid-container">
                {/* We use arrow functions in onClick so they only run when clicked */}
                {['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'].map((cls) => (
                    <div className="square" key={cls}>
                        <button className={cls} onClick={() => placeLetter(cls)} style={{ minHeight: '50px', minWidth: '50px' }}></button>
                    </div>
                ))}
            </div>
        </>
    );
}