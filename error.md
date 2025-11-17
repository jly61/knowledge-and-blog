 22:05:36.469 ./app/(dashboard)/notes/page.tsx:57:37
22:05:36.469 Type error: Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; _count: { links: number; backlinks: number; }; tags: { ...; }[]; } & { ...; }' is not assignable to type 'NoteWithRelations'.
22:05:36.469   Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; _count: { links: number; backlinks: number; }; tags: { ...; }[]; } & { ...; }' is missing the following properties from type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; tags: { id: string; name: string; createdAt: Date; slug: string; color: string | null; }[]; links: { ...; }[]; backlinks: { ...; }[]; _count?: { ...; } | undefined; }': links, backlinks
22:05:36.469 
22:05:36.469 [0m [90m 55 |[39m         [33m<[39m[33mdiv[39m className[33m=[39m[32m"grid gap-4"[39m[33m>[39m[0m
22:05:36.469 [0m [90m 56 |[39m           {notes[33m.[39mmap((note) [33m=>[39m ([0m
22:05:36.469 [0m[31m[1m>[22m[39m[90m 57 |[39m             [33m<[39m[33mNoteCard[39m key[33m=[39m{note[33m.[39mid} note[33m=[39m{note} [33m/[39m[33m>[39m[0m
22:05:36.470 [0m [90m    |[39m                                     [31m[1m^[22m[39m[0m
22:05:36.470 [0m [90m 58 |[39m           ))}[0m
22:05:36.470 [0m [90m 59 |[39m         [33m<[39m[33m/[39m[33mdiv[39m[33m>[39m[0m
22:05:36.470 [0m [90m 60 |[39m       )}[0m
22:05:36.530  ELIFECYCLE  Command failed with exit code 1.
22:05:36.554 Error: Command "pnpm build" exited with 1