./app/(dashboard)/notes/page.tsx:57:37
Type error: Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string; color: string; }; _count: { links: number; backlinks: number; }; tags: { id: string; name: string; createdAt: Date; slug: string; color: string; }[]; } & { ...; }' is not assignable to type 'NoteWithRelations'.
  Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string; color: string; }; _count: { links: number; backlinks: number; }; tags: { id: string; name: string; createdAt: Date; slug: string; color: string; }[]; } & { ...; }' is missing the following properties from type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string; color: string; }; tags: { id: string; name: string; createdAt: Date; slug: string; color: string; }[]; links: { ...; }[]; backlinks: { ...; }[]; _count?: { ...; }; }': links, backlinks
  55 |         <div className="grid gap-4">
  56 |           {notes.map((note) => (
> 57 |             <NoteCard key={note.id} note={note} />
     |                                     ^
  58 |           ))}
  59 |         </div>
  60 |       )}