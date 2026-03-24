"use client";

import { useState } from "react";

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

interface StudentCpfFieldProps {
  cpf: string;
}

export function StudentCpfField({ cpf }: StudentCpfFieldProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="text-sm text-muted-foreground transition-all"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="mr-2 font-medium text-foreground">CPF:</span>
      <span className="tracking-wide">
        {hovered ? formatCpf(cpf) : maskCpf(cpf)}
      </span>
    </div>
  );
}