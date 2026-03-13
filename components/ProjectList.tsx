import ProjectSection from "./HomeProject"

export default function ProjectList() {
    return (<div>
        <ProjectSection title="Personal Dashboard" href="/personaldash" imageSrc="/images/chess.jpeg"
            description="My goal with the project is to be able to do everything I&apos;d usually do across multiple apps in one consolidated place"/>
        
        <ProjectSection title="Chess Opening Study" href="/chessstudy" imageSrc="/images/chess.jpeg"
        description="My goal with the project is to give chess players something that they can use to study openings. Solutions like Chessbase are premium and paid options, which makes them inherently inaccessaible to a lot of potential users. Lichess has a robust study system, but doesn&apos;t have as robust features as Chessbase."/>
        
        <ProjectSection title="Web Extension" href="/webext" imageSrc="/images/chess.jpeg"
        description="My goal with the project is to create a web extension"/>
    
        <ProjectSection title="Guess The Voice" href="/guessvoice" imageSrc="/images/chess.jpeg"
        description="My goal with the project is to design a game where users have to guess the voice of the political figure based on a short audio snippet. Users hear a 15 second snippet and have an additional 15 seconds to guess the voice. Easier difficulties may be based on multiple choice options."/>
    
        <ProjectSection title="API Collection" href="/apicollect" imageSrc="/images/chess.jpeg"
        description="My goal with the project is have a collection of free API&apos;s that I can use collectively"/>
        </div>
    )
}