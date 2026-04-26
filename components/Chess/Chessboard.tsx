export default function Chessboard() {
    // Ranks and files for chessboard setup
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    {
        /*Dynamic Chessboard creation*/
    }
    return (
        <div className="chess-grid">
            {[...ranks].reverse().map((rank) =>
                files.map((file, fileIndex) => {
                    const isBlack = (rank + fileIndex) % 2 === 0;

                    return (
                        <div
                            key={`${file}${rank}`}
                            className={`chess-square ${isBlack ? 'black' : 'white'}`}
                        >
                            {file}
                            {rank}
                        </div>
                    );
                }),
            )}
        </div>
    );
}
