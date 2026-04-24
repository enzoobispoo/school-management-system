"use client";

export function openChargeStudentsModal() {
  window.dispatchEvent(new CustomEvent("openChargeStudentsModal"));
}