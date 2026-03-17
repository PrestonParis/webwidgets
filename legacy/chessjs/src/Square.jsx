export default function Square({ id = "a1", hasPiece = false }) {
    const highlightSquare = (e) => {
        e.target.style.backgroundColor = "#FFFFFF"
            ? e.target.style.backgroundColor = "#FFFF00"
            : e.target.style.backgroundColor = "FFFFFF"
    }
    return (<>
        <div className="square">
            <button id={id}
                className="square-button"
                onClick={(e) => highlightSquare(e)}
                haspiece={hasPiece.toString()}
            >{id}</button>
        </div>
    </>)
}