"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProfileIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      router.replace(`/profile?userId=${userId}`);
    }
  }, [userId, router]);

  return null;
}
