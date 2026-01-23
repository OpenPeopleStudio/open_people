# Development Docs

Owner: CTO

## Index

- [Setup](./setup.md)
- [Contributing](./contributing.md)
- [Testing Strategy](./testing.md)
- [Build Isolation](./build-isolation.md)

## OSS Quickstart Checklist

1) Clone + install
   - `git clone https://github.com/OpenPeopleStudio/open_people.git`
   - `cd open_people && npm install`
2) Configure env
   - `cp .env.local.example .env.local`
3) Run the app
   - `npm run dev`
   - Visit `http://localhost:3000`
4) Optional: seed Mars tenant data
   - `npm run db:migrate`
   - `npm run db:seed`
   - Visit `http://mars.localhost:3000/admin`
5) Before opening a PR
   - `npm run lint`
   - `npm run typecheck`

## Notes

- Keep local dev instructions aligned with `README.md`.
