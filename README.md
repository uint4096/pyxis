## Pyxis

[Pyxis](https://pyxis.ink) is a lightweight, offline-first text editor currently in active development.

**Note:** Pyxis currently only supports Linux operating systems.

### Features

Pyxis offers the following features:

- Offline-first operation
- Conflict-free synchronization
- Workspaces
- Markdown syntax support

See our complete roadmap [here](https://vintage-metatarsal-d86.notion.site/1b13e0e11cba803ba1a8e3f709eb15ae?v=1b13e0e11cba80aeb6f0000c40aeb7af).

### Running Locally

Pyxis uses [pnpm](https://pnpm.io/installation) as its package manager.

Run the following commands to set up the .env file and install client dependencies:

```bash
pnpm setup:dev
pnpm install
```

#### Core Components

Pyxis consists of several core components that can run independently and are bundled as separate binary crates:

**App**

The Tauri app bundled with the React frontend.

Run the development build:
```bash
pnpm start:app
```

Build for production:
```bash
pnpm build:app
```

Note: Running the app this way also runs the sync crate as a sidecar process.

**Server**

Required initially for authentication, and later if you've enabled the sync feature. It listens on a port specified using the `PORT` environment variable.

To run in the development environment:
```bash
pnpm start:server
```

For Docker deployment:
```bash
docker build --tag <tag> --target=<dev|prod> .
docker run -p <host_port>:<container_port> \
  --env-file <path_to_dotenv_file> \
  <tag>
```

**Sync**

You can run sync independently from the app using the following command:
```bash
pnpm start:sync 
```

To create a release build, run:
```bash
pnpm build:sync
```

All binary crates depend on a shared library crate called `pyxis_shared`.

### License

Copyright (c) 2025 pyxis.ink

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.