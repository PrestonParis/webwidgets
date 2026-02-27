const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

export default function Home() {
return (
    <>
    <h1 className="page-title-heading">Chess Study</h1>

    <div className="chess-grid">
        {[...ranks].reverse().map((rank) =>
        files.map((file, fileIndex) => {
            const isBlack = (rank + fileIndex) % 2 === 0;

            return (
                <div
                key={`${file}${rank}`}
                className={`chess-square ${isBlack ? "black" : "white"}`}>
                {file}
                {rank}
            </div>
            );
        }),
        )}
    </div>

    <div className="features-section">
        <h1 className="page-subheading">Features</h1>
        <h2 className="feature-element">Visualization</h2>
        <h2 className="feature-element">Repertoire</h2>
        <h2 className="feature-element">Opening Practice</h2>
    </div>
    </>
);
}
