import Header from "@/components/Header";
import ProjectList from "@/components/ProjectList";
import AboutMe from "@/components/AboutMe";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header/>
      <h1 className="page-title-heading">Preston Paris Project Showcase</h1>
      <AboutMe/>
      <ProjectList/>
      <Footer/>
    </>
  );
}
