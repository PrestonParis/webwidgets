import Header from "@/components/Global/Header";
import ProjectList from "@/components/2026Projects";
import AboutMe from "@/components/AboutMe";
import OldProjects from "@/components/OldProjects/OldProjects";
import Footer from "@/components/Global/Footer";

export default function Home() {
  return (
    <>
      <Header/>
      <h1 className="page-title-heading">Preston Paris Project Showcase</h1>
      <AboutMe/>
      <ProjectList/>
      <OldProjects/>
      <Footer />
    </>
  );
}
