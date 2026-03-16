import Header from "@/components/Header";
import ProjectList from "@/components/ProjectList";
import AboutMe from "@/components/AboutMe";
import Footer from "@/components/Footer";
import TicTacToe from "@/components/TicTacToe";
import CryptoDashboard from "@/components/AvaxCrypto";

export default function Home() {
  return (
    <>
      <Header/>
      <h1 className="page-title-heading">Preston Paris Project Showcase</h1>
      <AboutMe/>
      <ProjectList/>
      <TicTacToe/>
      <CryptoDashboard />
      <Footer/>
    </>
  );
}
