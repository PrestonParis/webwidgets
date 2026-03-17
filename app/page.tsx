import Header from "@/components/Header";
import ProjectList from "@/components/2026Projects";
import AboutMe from "@/components/AboutMe";
import Footer from "@/components/Footer";
import TicTacToe from "@/components/TicTacToe";
import CryptoDashboard from "@/components/AvaxCrypto";
import Lyrics from "@/components/Lyrics";

export default function Home() {
  return (
    <>
      <Header/>
      <h1 className="page-title-heading">Preston Paris Project Showcase</h1>
      <AboutMe/>
      <ProjectList/>
      <TicTacToe/>
      <CryptoDashboard />
      {/* Alpha Vantage Loading: API Issues */}
      <Lyrics />
      <Footer/>
    </>
  );
}
