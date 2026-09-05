"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, Input, Textarea } from "@/components/admin/form-fields";
import { Label } from "@/components/ui/label";
import { postFormSchema, type PostFormInput } from "@/lib/validations/admin";
import { createPost, updatePost } from "@/server/actions/admin";

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readingTime: string;
  published: boolean;
}

export function PostForm({ initial, onDone }: { initial?: PostRow; onDone: () => void }) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      slug: initial?.slug ?? "",
      title: initial?.title ?? "",
      excerpt: initial?.excerpt ?? "",
      content: initial?.content ?? "",
      category: initial?.category ?? "",
      readingTime: initial?.readingTime ?? "5 мин",
      published: initial?.published ?? true,
    },
  });

  async function onSubmit(values: PostFormInput) {
    const result = isEdit ? await updatePost(initial!.id, values) : await createPost(values);
    handleFormResult<PostFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Статья обновлена" : "Статья создана",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Заголовок" htmlFor="title" error={errors.title}>
        <Input id="title" {...register("title")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" htmlFor="slug" error={errors.slug} hint="латиница, для URL">
          <Input id="slug" {...register("slug")} />
        </Field>
        <Field
          label="Рубрика"
          htmlFor="category"
          error={errors.category}
          hint="Инженерам, Аналитика…"
        >
          <Input id="category" {...register("category")} />
        </Field>
      </div>

      <Field
        label="Короткое описание"
        htmlFor="excerpt"
        error={errors.excerpt}
        hint="показывается в карточке"
      >
        <Textarea id="excerpt" rows={2} {...register("excerpt")} />
      </Field>

      <Field label="Текст статьи" htmlFor="content" error={errors.content}>
        <Textarea id="content" rows={10} {...register("content")} />
      </Field>

      <Field label="Время чтения" htmlFor="readingTime" error={errors.readingTime}>
        <Input id="readingTime" {...register("readingTime")} className="max-w-[160px]" />
      </Field>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
        <div>
          <Label htmlFor="published">Опубликована</Label>
          <p className="text-xs text-muted-foreground">
            Скрытые статьи не показываются в блоге и на главной.
          </p>
        </div>
        <Controller
          control={control}
          name="published"
          render={({ field }) => (
            <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" variant="signal" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
