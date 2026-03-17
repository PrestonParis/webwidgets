import File from "./File";
import React, { useRef } from "react"

const allFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
const allRanks = [1, 2, 3, 4, 5, 6, 7, 8];
const rookImage = "./assets/black-rook.png"


class Rook {
    constructor(color = "White", file = "a", rank = 1) {
        this.color = color
        this.file = file
        this.rank = rank
    }

    canMoveto(wantFile, wantRank) {
        /* Want Rank Change */
        if (this.rank !== wantRank && this.file !== wantFile) {
            // No diag rook
            return false
        }
        else if (this.rank == wantRank && this.file == wantFile) {
            // Cannot stand still
            return false
        }

        // Horizontal Move, i.e: a1 -> h1
        if (this.file != wantFile) {
            let currFileIndex = allFiles.indexOf(this.file)
            let wantFileIndex = allFiles.indexOf(wantFile)
            let wantSquares = allFiles.slice(currFileIndex + this.rank, wantFileIndex + this.rank)
            wantSquares.forEach((element, index) => {
                wantSquares[index] = element + this.rank
            })
            // ? Crude solution, check actual piece existence in future
            // ! Currently an issue with accessing elements when the page has not been refreshed
            for (let sq of wantSquares) {
                let element = document.getElementById(sq)
                if (element.innerText !== element.id) {
                    return false
                }
            }


        }
        // Vertical Move, i.e: a1 => a8
        else {

        }
        // Add final check for upcomingSquares to see if move is valid
        return true
    }
}

const r = new Rook("White", "a", 1)
//console.log(r.canMoveto("h", 1))


export default function Grid() {
    return (<>
        <div className="grid-container">
            <File file="a" />
            <File file="b" />
            <File file="c" />
            <File file="d" />
            <File file="e" />
            <File file="f" />
            <File file="g" />
            <File file="h" />
        </div>
    </>)
}