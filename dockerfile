FROM rust:bookworm as base
WORKDIR /app

COPY ./crates/pyxis-server ./crates/pyxis-server
COPY ./crates/pyxis_shared ./crates/pyxis_shared
COPY ./crates/pyxis-app ./crates/pyxis-app
COPY ./crates/pyxis-sync ./crates/pyxis-sync
COPY Cargo.toml Cargo.lock ./

FROM rust:bookworm as dev
WORKDIR /app
COPY --from=base /app .

RUN cargo build -p pyxis-server
CMD [ "cargo", "run", "-p" , "pyxis-server" ]