'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  email: z.string().email('Ingresa un email válido'),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordClient() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: Values) => {
    setIsSubmitting(true);
    try {
      // TODO(backend): el endpoint POST /auth/forgot-password todavía no existe.
      // La pantalla está completa; conectar cuando el backend implemente el
      // envío del correo de restablecimiento.
      await api.post('/auth/forgot-password', { email: values.email });
    } catch {
      // Respuesta neutra: no revelamos si el correo está registrado
      // (protección contra enumeración de cuentas).
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <MailCheck className="size-6" strokeWidth={1.75} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Revisa tu correo
          </h1>
          <p className="text-sm text-muted-foreground">
            Si existe una cuenta asociada a{' '}
            <span className="font-medium text-foreground">
              {form.getValues('email')}
            </span>
            , te enviamos un enlace para restablecer tu contraseña. Revisa también
            la carpeta de spam.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href="/login">
            <ChevronLeft className="size-4" /> Volver a iniciar sesión
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Olvidaste tu contraseña? <span aria-hidden>🔒</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Escribe tu correo y te enviaremos instrucciones para restablecerla.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    autoComplete="email"
                    autoFocus
                    variant="lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ChevronLeft className="size-4" /> Volver a iniciar sesión
          </Link>
        </form>
      </Form>
    </div>
  );
}
