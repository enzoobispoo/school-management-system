"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeTeacherModal } from "./change-teacher-modal";

interface ChangeTeacherButtonProps {
  turmaId: string;
  turmaNome: string;
  currentTeacherId: string;
  currentTeacherName: string;
  onSuccess?: () => Promise<void> | void;
}

export function ChangeTeacherButton({
  turmaId,
  turmaNome,
  currentTeacherId,
  currentTeacherName,
  onSuccess,
}: ChangeTeacherButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        onClick={() => setOpen(true)}
      >
        <Repeat className="mr-2 h-4 w-4" />
        Trocar professor
      </Button>

      <ChangeTeacherModal
        open={open}
        onOpenChange={setOpen}
        turmaId={turmaId}
        turmaNome={turmaNome}
        currentTeacherId={currentTeacherId}
        currentTeacherName={currentTeacherName}
        onSuccess={onSuccess}
      />
    </>
  );
}