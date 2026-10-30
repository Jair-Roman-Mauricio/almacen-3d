"use client";
import { useEffect } from "react";
export function InputModality() {
  useEffect(() => {
    const keyboard = () => {
        document.documentElement.dataset.input = "keyboard";
      },
      pointer = () => {
        document.documentElement.dataset.input = "pointer";
      };
    document.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", pointer);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", pointer);
    };
  }, []);
  return null;
}
