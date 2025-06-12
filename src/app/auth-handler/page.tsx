"use client";
import { Suspense } from "react";
import AuthHandlerInner from "./AuthHandlerInner";

export default function AuthHandlerPage() {
  return (
    <Suspense>
      <AuthHandlerInner />
    </Suspense>
  );
}