import Link from "next/link";
import Image from "next/image";

type ProjectProps = {
    title: string;
    href: string;
    imageSrc: string;
    description: string;
    width: number;
    height: number;
}

export default function ProjectSection({title, href, imageSrc, description, width, height}: ProjectProps ){
    return (
        <div className="home-project-item">
            <Link href={href} className="project-link">{title}</Link>
            <Image className="project-image" src={imageSrc} alt={title} width={width} height={height}></Image>
            <p className="project-description">{description}</p>
        </div>
    )
}