import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Listing } from "@/lib/listings";

type Errors = Partial<Record<"name" | "email" | "message", string>>;
const field = "glass h-11 w-full rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function ContactAgentDialog({ l, children }: { l: Listing; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: `Hi, I'm interested in "${l.title}" (${l.id}). Is it still available?` });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errors = {};
    if (!form.name.trim()) er.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "Please enter a valid email";
    if (!form.message.trim()) er.message = "Please enter a message";
    setErrors(er);
    if (Object.keys(er).length === 0) setSent(true);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSent(false); setErrors({}); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {sent ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <DialogTitle className="mt-4 font-display text-2xl">Enquiry sent</DialogTitle>
            <DialogDescription className="mt-2">Thanks, {form.name.split(" ")[0]}. This is a simulated form — in the prototype no message is actually delivered to {l.agency}.</DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Contact {l.agency}</DialogTitle>
              <DialogDescription>Simulated enquiry — nothing is sent in this prototype.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} noValidate className="space-y-3">
              {([["name", "Full name *", "text"], ["email", "Email *", "email"], ["phone", "Phone (optional)", "tel"]] as const).map(([k, label, type]) => (
                <label key={k} className="block space-y-1 text-sm">
                  <span>{label}</span>
                  <input type={type} className={field} value={form[k]} aria-invalid={!!errors[k as keyof Errors]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  {errors[k as keyof Errors] && <span className="text-xs text-destructive">{errors[k as keyof Errors]}</span>}
                </label>
              ))}
              <label className="block space-y-1 text-sm">
                <span>Message *</span>
                <textarea rows={4} className={`${field} h-auto py-2`} value={form.message} aria-invalid={!!errors.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                {errors.message && <span className="text-xs text-destructive">{errors.message}</span>}
              </label>
              <button type="submit" className="bg-gold h-11 w-full rounded-xl text-sm font-semibold">Send enquiry</button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
