import type { Metadata } from "next";
import TerminalClient from "./TerminalClient";

export const metadata: Metadata = {
  title: "~/terminal — Tejeswaar Reddy",
  description: "You found the easter egg. Welcome to the terminal.",
};

export default function TerminalPage() {
  return <TerminalClient />;
}
