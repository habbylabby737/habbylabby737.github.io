import { useEffect, useState, type ComponentType } from "react";
import "./extra.css";
import { BootScreen } from "./components/playground/boot-screen";

export default function Kinetic() {
  const [Playground, setPlayground] = useState<ComponentType | null>(null);

  useEffect(() => {
    let live = true;
    void import("./components/playground/playground").then((mod) => {
      if (live) setPlayground(() => mod.Playground);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!Playground) return <BootScreen />;
  return <Playground />;
}
