21:56:37.812 ./app/(dashboard)/notes/[id]/edit/page.tsx:41:9
21:56:37.812 Type error: Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; tags: { id: string; name: string; createdAt: Date; slug: string; color: string | null; }[]; } & { ...; }' is not assignable to type 'NoteWithRelations | undefined'.
21:56:37.812   Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; tags: { id: string; name: string; createdAt: Date; slug: string; color: string | null; }[]; } & { ...; }' is not assignable to type 'NoteWithRelations'.
21:56:37.812     Type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; tags: { id: string; name: string; createdAt: Date; slug: string; color: string | null; }[]; } & { ...; }' is missing the following properties from type '{ category: { id: string; name: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; color: string | null; } | null; tags: { id: string; name: string; createdAt: Date; slug: string; color: string | null; }[]; links: { ...; }[]; backlinks: { ...; }[]; _count?: { ...; } | undefined; }': links, backlinks
21:56:37.812 
21:56:37.812 [0m [90m 39 |[39m       [33m<[39m[33mh1[39m className[33m=[39m[32m"text-3xl font-bold mb-6"[39m[33m>[39m编辑笔记[33m<[39m[33m/[39m[33mh1[39m[33m>[39m[0m
21:56:37.813 [0m [90m 40 |[39m       [33m<[39m[33mNoteEditor[39m[0m
21:56:37.813 [0m[31m[1m>[22m[39m[90m 41 |[39m         note[33m=[39m{note}[0m
21:56:37.813 [0m [90m    |[39m         [31m[1m^[22m[39m[0m
21:56:37.813 [0m [90m 42 |[39m         categories[33m=[39m{categories}[0m
21:56:37.813 [0m [90m 43 |[39m         tags[33m=[39m{tags}[0m
21:56:37.813 [0m [90m 44 |[39m       [33m/[39m[33m>[39m[0m
21:56:37.868  ELIFECYCLE  Command failed with exit code 1.
21:56:37.893 Error: Command "pnpm build" exited with 1