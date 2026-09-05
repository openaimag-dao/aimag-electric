"use client";

import * as React from "react";

/**
 * Shared state machine for admin CRUD managers: text search, create/edit
 * dialog, and delete confirmation. Centralizes the pattern that was repeated
 * across every entity manager.
 *
 * @param rows       full row set
 * @param searchable maps a row to the string searched against the query
 */
export function useCrudManager<Row, EditRow = Row>(rows: Row[], searchable: (row: Row) => string) {
  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EditRow | undefined>();
  const [deleting, setDeleting] = React.useState<Row | undefined>();

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => searchable(r).toLowerCase().includes(q));
  }, [rows, query, searchable]);

  const openCreate = React.useCallback(() => {
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = React.useCallback((row: EditRow) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  const closeForm = React.useCallback(() => setFormOpen(false), []);

  const closeDelete = React.useCallback((open: boolean) => {
    if (!open) setDeleting(undefined);
  }, []);

  return {
    query,
    setQuery,
    filtered,
    formOpen,
    setFormOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    deleting,
    setDeleting,
    closeDelete,
  };
}
