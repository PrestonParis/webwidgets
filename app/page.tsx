import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div>
      <Header/>
      <h1 className="page-title-heading">Preston Paris Project Showcase</h1>
      <div className="page-grid-container">
        <div className="page-grid-item">
          <Link href="/chessstudy" className="project-name-button">
            Chess Opening Study
          </Link>
          <p>My goal with the project is to give chess players something that they can use to study openings.
            Solutions like Chessbase are premium and paid options, which makes them inherently inaccessaible 
            to a lot of potential users. Lichess has a robust study system, but doesn&apos;t have as robust
            features as Chessbase
          </p>
        </div>
        <div className="page-grid-item">
          <Link href="/webext" className="project-name-button">
            Web Extension
          </Link>
          <p>My goal with the project is to give chess players something that they can use to study openings.
            Solutions like Chessbase are premium and paid options, which makes them inherently inaccessaible 
            to a lot of potential users. Lichess has a robust study system, but doesn&apos;t have as robust
            features as Chessbase
          </p>
        </div>
        <div className="page-grid-item">
          <Link href="/guessvoice" className="project-name-button">
            Guess The Voice
          </Link>
          <p>My goal with the project is to design a game where users have to guess the voice of the political 
            figure based on a short audio snippet. Users hear a 15 second snippet and have an additional 15 seconds 
            to guess the voice. Easier difficulties may be based on multiple choice options 
          </p>
        </div>
        <div className="page-grid-item">
          <Link href="/apicollect" className="project-name-button">
            API Collection
          </Link>
          <p>My goal with the project is have a collection of API&apos;s to give chess players something that they can use to study openings.
            Solutions like Chessbase are premium and paid options, which makes them inherently inaccessaible 
            to a lot of potential users. Lichess has a robust study system, but doesn&apos;t have as robust
            features as Chessbase
          </p>
        </div>
      </div>
    </div>
  );
}
