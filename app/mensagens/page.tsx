import { Suspense } from "react";
import { SchoolChatPage } from "@/components/school-chat/school-chat-page";

export default function MensagensRoutePage() {
  return (
    <Suspense fallback={null}>
      <SchoolChatPage />
    </Suspense>
  );
}
