// import './App.css'
import Grid from "./Grid"

function App() {
  return (
    <>
      <h1>Chess App</h1>
      <Grid />
    </>
  )
}

export default App


/* Intended Structure 
files structure
- Grid.jsx
- File.jsx - May delete later, ideally have for flexibility in future
- Square.jsx
*/


/* Psuedocode for moving pieces 
1) button id = a1 onclick = alertClickedSquare("a1"), hasPiece = "yes, rook", 
2) alertClickedSquare(square): square.color = yellow
3) button id = h1 onclick = alertClickedQuare("h1"), hasPiece = "no"
4) alertClickedSquare(square): square.src = "rook.jpg" if move.isValid(a1, h1, "rook"), else pass
5) isValid(square1, square2, piece): if (logicchecksout): return true, else: return false
*/


