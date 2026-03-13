import Link from "next/link";
import Image from "next/image";

type ProjectProps = {
    title: string;
    href: string;
    imageSrc: string;
    description: string;
}

export default function ProjectSection({title, href, imageSrc, description}: ProjectProps ){
    return (
        <div className="home-project-item">
            <Link href={href} className="project-name-button">{title}</Link>
            <Image src={imageSrc} alt={title} width={200} height={200}></Image>
            <p className="project-description">{description}</p>
        </div>
    )
}