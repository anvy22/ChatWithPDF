import Image from "next/image";
import Texter from "./components/FileSelector";
import { ModeToggle } from "./components/darkModeButton";


export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col">

            <div className="fixed top-6 right-6"><ModeToggle /></div>
             <Texter />
      
    </div>
  );
}
