import Image from 'next/image';
import Link from 'next/link';

export default function AboutMe() {
    return (
        <div className="about-me-section">
            <h2 className="page-heading-2">About Me</h2>
            <div className="content-container">
                <Image
                    className="my-picture"
                    src="/images/Linkedinpfp.jpeg"
                    alt="Picture of Preston Paris"
                    width={200}
                    height={200}
                ></Image>
                <p className="personal-description">
                    My name is Preston Paris. I am a third year student at
                    Georgia State University with a 3.0 GPA. I am currently
                    enrolled in a Bachelor of Science (B.S) Program for Computer
                    Science and I am on track to graduate in June of 2027
                </p>
            </div>
            <div className="links-container">
                <Link href={'https://www.linkedin.com/in/preston-paris-gsu/'}>
                    Linkedin
                </Link>
                <Link href={'https://github.com/PrestonParis/'}>GitHub</Link>
                <Link href="/resume/PrestonParisResume.docx" download>
                    Resume
                </Link>
            </div>
        </div>
    );
}
