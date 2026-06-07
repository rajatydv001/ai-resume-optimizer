"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface Props { resumeId: string; fileName: string }

export default function DeleteResumeButton({ resumeId, fileName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Resume deleted");
      router.push("/resumes");
    } catch { toast.error("Failed to delete resume."); setDeleting(false); }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive/70 hover:text-destructive"><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Resume</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to delete &quot;{fileName}&quot;? This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild><Button variant="outline" size="sm" disabled={deleting}>Cancel</Button></AlertDialogCancel>
          <AlertDialogAction asChild><Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>{deleting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Deleting...</> : "Delete"}</Button></AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
