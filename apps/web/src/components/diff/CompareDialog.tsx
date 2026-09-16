import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type CompareDialogProps = {
  trigger: React.ReactNode;
  /** Roda `analyzeFile` + `diffDocuments` (em `App.tsx`, que já tem o
   * documento atual e o `locale`) e troca a tela inteira pro
   * `DiffResultPanel` quando dá certo — este diálogo só existe pra pedir o
   * segundo arquivo, não sabe nada de parsing/diff. */
  onCompareFile: (file: File) => Promise<{ ok: boolean; message?: string | undefined }>;
};

/**
 * Diálogo só pra escolher o segundo arquivo a comparar (Fase 14) — reusa o
 * mesmo `Dropzone` do fluxo de import principal.
 */
export function CompareDialog({ trigger, onCompareFile }: CompareDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(file: File) {
    setLoading(true);
    setError(undefined);
    const result = await onCompareFile(file);
    setLoading(false);
    if (result.ok) {
      setOpen(false);
    } else {
      setError(result.message ?? t.diff.compareError);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.diff.compareDialogTitle}</DialogTitle>
          <DialogDescription>{t.diff.compareDialogDescription}</DialogDescription>
        </DialogHeader>

        <Dropzone onFile={(file) => void onFile(file)} disabled={loading} />

        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t.diff.compareErrorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
