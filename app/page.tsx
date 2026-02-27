import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1 className="page-title-heading">Preston Paris Project Showcase</h1>
      <div className="page-grid-container">
        <div className="page-grid-item">
          <Link href="/chessstudy" className="project-name-button">
            Chess Idea
          </Link>
        </div>
        <div className="page-grid-item">
          <Link href="/webext" className="project-name-button">
            Web Extension Idea
          </Link>
        </div>
        <div className="page-grid-item">
          <Link href="/" className="project-name-button">
            Idea 3
          </Link>
        </div>
        <div className="page-grid-item">
          <Link href="/" className="project-name-button">
            Idea 4
          </Link>
        </div>
      </div>
    </>
  );
}
